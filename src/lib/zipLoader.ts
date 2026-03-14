import JSZip from 'jszip';

// Normalize a relative path against a base directory
function normPath(p: string, base?: string): string {
  if (!p) return '';
  if (p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://') || p.startsWith('blob:')) return p;
  p = p.split('?')[0].split('#')[0];
  const parts = (base ? base.split('/').slice(0, -1) : []).concat(p.split('/'));
  const out: string[] = [];
  for (const seg of parts) {
    if (seg === '..') out.pop();
    else if (seg && seg !== '.') out.push(seg);
  }
  return out.join('/');
}

function buildLookup(zipFiles: Record<string, Blob>): Record<string, Blob> {
  const lookup: Record<string, Blob> = {};
  for (const [path, blob] of Object.entries(zipFiles)) {
    const norm = path.replace(/^[./]+/, '');
    lookup[norm] = blob;
    const name = path.split('/').pop()!;
    if (!lookup[name]) lookup[name] = blob;
  }
  return lookup;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target!.result as string);
    r.readAsDataURL(blob);
  });
}

async function resolveCssUrls(cssText: string, cssPath: string, lookup: Record<string, Blob>): Promise<string> {
  const matches = [...cssText.matchAll(/url\(["']?([^)"'\s]+)["']?\)/gi)];
  for (const m of matches) {
    const raw = m[1];
    if (raw.startsWith('data:') || raw.startsWith('http')) continue;
    const resolved = normPath(raw, cssPath);
    const candidates = [resolved, resolved.replace(/^[./]+/, '')];
    for (const c of candidates) {
      if (lookup[c]) {
        const dataUrl = await blobToDataUrl(lookup[c]);
        cssText = cssText.split(m[0]).join(`url(${dataUrl})`);
        break;
      }
    }
  }
  return cssText;
}

export async function loadZipFile(file: File): Promise<{ html: string; zipFiles: Record<string, Blob>; blobMap: Record<string, string> }> {
  const zip = await JSZip.loadAsync(file);
  const zipFiles: Record<string, Blob> = {};
  const blobMap: Record<string, string> = {};

  const jobs: Promise<void>[] = [];
  zip.forEach((p, e) => {
    if (!e.dir) jobs.push(e.async('blob').then((b) => { zipFiles[p] = b; }));
  });
  await Promise.all(jobs);

  const htmlKey = Object.keys(zipFiles).find((k) => k === 'index.html' || k.endsWith('/index.html'));
  if (!htmlKey) throw new Error('index.html não encontrado no ZIP');

  const rawHtml = await zipFiles[htmlKey].text();
  const lookup = buildLookup(zipFiles);

  // Parse HTML and resolve assets
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Resolve images
  const imgs = doc.querySelectorAll('img[src]');
  for (const img of imgs) {
    const src = img.getAttribute('src')!;
    const resolved = normPath(src, htmlKey);
    const candidates = [resolved, resolved.replace(/^[./]+/, ''), src, src.replace(/^[./]+/, '')];
    for (const c of candidates) {
      if (lookup[c]) {
        const url = URL.createObjectURL(lookup[c]);
        blobMap[url] = c;
        img.setAttribute('src', url);
        break;
      }
    }
  }

  // Resolve background images in style attributes
  const allEls = doc.querySelectorAll('[style]');
  for (const el of allEls) {
    const style = el.getAttribute('style')!;
    if (style.includes('url(')) {
      const resolved = await resolveCssUrls(style, htmlKey, lookup);
      el.setAttribute('style', resolved);
    }
  }

  // Resolve CSS links
  const links = doc.querySelectorAll('link[rel="stylesheet"][href]');
  for (const link of links) {
    const href = link.getAttribute('href')!;
    if (href.startsWith('http')) continue;
    const resolved = normPath(href, htmlKey);
    const candidates = [resolved, resolved.replace(/^[./]+/, '')];
    for (const c of candidates) {
      if (lookup[c]) {
        const cssText = await lookup[c].text();
        const resolvedCss = await resolveCssUrls(cssText, c, lookup);
        const style = doc.createElement('style');
        style.textContent = resolvedCss;
        link.replaceWith(style);
        break;
      }
    }
  }

  // Resolve script srcs
  const scripts = doc.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src')!;
    if (src.startsWith('http')) continue;
    const resolved = normPath(src, htmlKey);
    const candidates = [resolved, resolved.replace(/^[./]+/, '')];
    for (const c of candidates) {
      if (lookup[c]) {
        const jsText = await lookup[c].text();
        const inlineScript = doc.createElement('script');
        inlineScript.textContent = jsText;
        script.replaceWith(inlineScript);
        break;
      }
    }
  }

  const html = '<!DOCTYPE html>\n<html>' + doc.documentElement.innerHTML + '</html>';
  return { html, zipFiles, blobMap };
}

export function getEditorScript(): string {
  return `
<style id="__eds__">
[data-ed]{ position:relative!important; }
body.ed-on [data-ed]:hover{
  outline: 1.5px dashed hsl(152 100% 45% / 0.5) !important;
  outline-offset: 0 !important;
}
body.ed-on [data-ed].edd{
  outline: 2px dashed hsl(152 100% 45%) !important;
  outline-offset: 0 !important;
}
.ed-bar{
  display: none; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  height: 28px; align-items: center; gap: 1px; padding: 0 5px;
  background: hsl(152 100% 45%); border-radius: 8px; border: none;
  z-index: 2147483646; pointer-events: all;
  box-shadow: 0 2px 10px hsl(152 100% 45% / 0.35), 0 1px 4px rgba(0,0,0,0.4);
  white-space: nowrap;
}
body.ed-on [data-ed]:hover .ed-bar,
body.ed-on [data-ed].edd .ed-bar{ display: inline-flex !important; }
.ed-bar .ed-name{ display:none; }
.ed-bar button{
  background: transparent; border: none; color: rgba(0,0,0,0.7);
  width: 26px; height: 24px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 5px; transition: background .12s, color .12s;
  flex-shrink: 0; padding: 0;
}
.ed-bar button:hover{ background: rgba(0,0,0,0.14); color: #000; }
body.ed-on [data-ed-i]{ cursor:crosshair!important }
body.ed-on [data-ed-i]:hover{ outline: 2px dashed hsl(152 100% 45%) !important; outline-offset: 2px !important; }
body.ed-on h1,body.ed-on h2,body.ed-on h3,body.ed-on h4,body.ed-on h5,body.ed-on h6,
body.ed-on p,body.ed-on span,body.ed-on li,body.ed-on label,body.ed-on button,
body.ed-on strong,body.ed-on em,body.ed-on small{ cursor:text!important }
[contenteditable=true]{
  outline: 2px solid hsl(152 100% 45%) !important;
  background: hsl(152 100% 45% / 0.06) !important;
  cursor: text !important; min-width: 4px; min-height: 1em; border-radius: 3px;
}
body.ed-on .ed-el-sel{ outline: 2px solid #63a4ff !important; outline-offset: 2px !important; }
</style>
<script id="__edj__">
(function(){
var P=window.parent;
var elCount=0;
var edActive=false;
var tagged=new Set();
var taggedEls=new Set();
var taggedImgs=new Set();
var selectedElRef=null;

function getComputedProps(el){
  var cs=window.getComputedStyle(el);
  return {
    id: el.getAttribute('data-el-id')||el.getAttribute('data-ed')||'',
    tag: el.tagName.toLowerCase(),
    text: el.textContent||'',
    fontFamily: cs.fontFamily.replace(/['"]/g,''),
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    color: rgbToHex(cs.color),
    backgroundColor: rgbToHex(cs.backgroundColor),
    textAlign: cs.textAlign,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    width: cs.width,
    height: cs.height,
    padding: cs.padding,
    margin: cs.margin,
    borderRadius: cs.borderRadius,
    opacity: cs.opacity
  };
}

function rgbToHex(rgb){
  if(!rgb||rgb==='transparent'||rgb==='rgba(0, 0, 0, 0)')return 'transparent';
  var m=rgb.match(/\\d+/g);
  if(!m||m.length<3)return rgb;
  return '#'+((1<<24)+(parseInt(m[0])<<16)+(parseInt(m[1])<<8)+parseInt(m[2])).toString(16).slice(1).toUpperCase();
}

function selectElement(el){
  document.querySelectorAll('.ed-el-sel').forEach(function(e){e.classList.remove('ed-el-sel');});
  if(el){
    el.classList.add('ed-el-sel');
    selectedElRef=el;
    P.postMessage({t:'elSel',props:getComputedProps(el)},'*');
  }
}

function setupSection(el){
  if(!el||tagged.has(el))return;
  tagged.add(el);
  var sid=el.id||(el.tagName.toLowerCase()+elCount++);
  if(!el.getAttribute('data-ed'))el.setAttribute('data-ed',sid);
  else sid=el.getAttribute('data-ed');
  if(!el.querySelector('.ed-bar')){
    var bar=document.createElement('div');
    bar.className='ed-bar';
    bar.innerHTML='<span class="ed-name">'+sid+'</span>'
      +'<button onmousedown="event.stopPropagation();var s=this.closest(\\'[data-ed]\\'),p=s.previousElementSibling;if(p)s.parentNode.insertBefore(s,p);window.parent.postMessage({t:\\'sync\\'},\\'*\\')" title="↑"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg></button>'
      +'<button onmousedown="event.stopPropagation();var s=this.closest(\\'[data-ed]\\'),n=s.nextElementSibling;if(n)s.parentNode.insertBefore(n,s);window.parent.postMessage({t:\\'sync\\'},\\'*\\')" title="↓"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>'
      +'<button onmousedown="event.stopPropagation();var s=this.closest(\\'[data-ed]\\');window.parent.postMessage({t:\\'editHtml\\',id:s.dataset.ed,html:s.outerHTML},\\'*\\')" title="HTML"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></button>'
      +'<button class="ed-btn-del" onmousedown="event.stopPropagation();if(confirm(\\'Excluir esta seção?\\'))this.closest(\\'[data-ed]\\').remove();window.parent.postMessage({t:\\'sync\\'},\\'*\\')" title="✕"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    el.insertBefore(bar,el.firstChild);
  }
  el.addEventListener('click',function(e){
    if(!edActive)return;
    if(e.target.closest('.ed-bar'))return;
    document.querySelectorAll('[data-ed]').forEach(function(s){s.classList.remove('edd');});
    el.classList.add('edd');
    P.postMessage({t:'sel',id:sid,tag:el.tagName},'*');
    // Also select the section element for properties
    selectElement(el);
    e.stopPropagation();
  });
  el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,span,li,label,strong,em,small').forEach(function(child){
    setupElement(child);
  });
  el.querySelectorAll('img').forEach(function(img){
    setupImg(img);
  });
}

function setupElement(el){
  if(taggedEls.has(el))return;
  if(el.closest('.ed-bar'))return;
  taggedEls.add(el);
  if(!el.getAttribute('data-el-id'))el.setAttribute('data-el-id','el'+(elCount++));
  
  // Single click selects element for properties
  el.addEventListener('click',function(e){
    if(!edActive)return;
    e.stopPropagation();
    selectElement(el);
  });
  
  el.addEventListener('dblclick',function(e){
    if(!edActive)return;
    e.stopPropagation();
    if(el.tagName==='A')e.preventDefault();
    if(el.isContentEditable)return;
    el.contentEditable='true';
    el.focus();
    function done(){el.removeAttribute('contenteditable');P.postMessage({t:'sync'},'*');selectElement(el);}
    el.addEventListener('blur',done,{once:true});
    el.addEventListener('keydown',function(ev){if(ev.key==='Escape'){ev.preventDefault();el.blur();}});
  });
}

function setupImg(img){
  if(taggedImgs.has(img))return;
  taggedImgs.add(img);
  img.setAttribute('data-ed-i','');
  img.addEventListener('click',function(e){
    if(!edActive)return;
    e.stopPropagation();e.preventDefault();
    P.postMessage({t:'img',src:img.src},'*');
  });
}

document.querySelectorAll('section,nav,footer,header,.ticker,.hall').forEach(function(el){ setupSection(el); });
document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,span,li,label,strong,em,small').forEach(function(el){ setupElement(el); });
document.querySelectorAll('img').forEach(function(img){ setupImg(img); });

window.addEventListener('message',function(e){
  var d=e.data;
  if(d.t==='setEditMode'){
    edActive=d.on;
    if(d.on)document.body.classList.add('ed-on');
    else{
      document.body.classList.remove('ed-on');
      document.querySelectorAll('[data-ed]').forEach(function(s){s.classList.remove('edd');});
      document.querySelectorAll('.ed-el-sel').forEach(function(e){e.classList.remove('ed-el-sel');});
      selectedElRef=null;
    }
  }
  if(d.t==='hilite'){
    document.querySelectorAll('[data-ed]').forEach(function(s){s.classList.remove('edd');});
    var s=document.querySelector('[data-ed="'+d.id+'"]');
    if(s){s.classList.add('edd');s.scrollIntoView({behavior:'auto',block:'center'});P.postMessage({t:'sel',id:d.id,tag:s.tagName},'*');selectElement(s);}
  }
  if(d.t==='addSec'){
    var tmp=document.createElement('div');tmp.innerHTML=d.html;
    var ns=tmp.firstElementChild||tmp;
    var f=document.querySelector('footer');
    if(f)f.insertAdjacentElement('beforebegin',ns);
    else document.body.appendChild(ns);
    setupSection(ns);
    P.postMessage({t:'sync'},'*');
  }
  if(d.t==='inject'){
    if(d.where==='head')document.head.insertAdjacentHTML('beforeend',d.code);
    else if(d.where==='body_top')document.body.insertAdjacentHTML('afterbegin',d.code);
    else if(d.where==='body_end')document.body.insertAdjacentHTML('beforeend',d.code);
    P.postMessage({t:'sync'},'*');
  }
  if(d.t==='replSec'){
    var el=document.querySelector('[data-ed="'+d.id+'"]');
    if(el){var tmp=document.createElement('div');tmp.innerHTML=d.html;var newEl=tmp.firstElementChild;if(newEl){el.replaceWith(newEl);setupSection(newEl);}}
    P.postMessage({t:'sync'},'*');
  }
  // Set CSS property on selected element
  if(d.t==='setProp'){
    if(!selectedElRef)return;
    selectedElRef.style[d.prop]=d.value;
    P.postMessage({t:'elSel',props:getComputedProps(selectedElRef)},'*');
  }
  // Set text content
  if(d.t==='setText'){
    if(!selectedElRef)return;
    selectedElRef.textContent=d.value;
    P.postMessage({t:'elSel',props:getComputedProps(selectedElRef)},'*');
  }
  // Request props refresh
  if(d.t==='getProps'){
    if(selectedElRef){
      P.postMessage({t:'elSel',props:getComputedProps(selectedElRef)},'*');
    }
  }
});

P.postMessage({t:'ready'},'*');
})();
<\/script>`;
}
