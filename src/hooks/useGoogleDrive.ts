import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
}

interface DriveResponse {
  folder_id?: string;
  files?: DriveFile[];
  error?: string;
}

type DrivePathItem = { id: string; name: string };
type DriveCacheEntry = { files: DriveFile[]; timestamp: number };

const PREFETCH_TTL = 300_000; // 5 min

const getFunctionUrl = (action: string, params?: Record<string, string>) => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const search = new URLSearchParams({ action, ...(params || {}) });
  return `https://${projectId}.supabase.co/functions/v1/google-drive?${search.toString()}`;
};

const getAuthHeaders = async (contentType?: string) => {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) {
    throw new Error('Sessão expirada');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
};

function loadCacheFromStorage(companyId: string): Record<string, DriveCacheEntry> {
  try {
    const raw = localStorage.getItem(`drive_cache_${companyId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCacheToStorage(companyId: string, cache: Record<string, DriveCacheEntry>) {
  try {
    if (Object.keys(cache).length > 0) {
      localStorage.setItem(`drive_cache_${companyId}`, JSON.stringify(cache));
    }
  } catch {}
}

export function useGoogleDrive(companyId?: string, companyName?: string) {
  const { user } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrivePathItem[]>([]);
  const [cache, setCache] = useState<Record<string, DriveCacheEntry>>(() =>
    companyId ? loadCacheFromStorage(companyId) : {}
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Persist cache to localStorage
  useEffect(() => {
    if (companyId && Object.keys(cache).length > 0) {
      saveCacheToStorage(companyId, cache);
    }
  }, [cache, companyId]);

  // Reset cache when company changes
  useEffect(() => {
    if (companyId) {
      setCache(loadCacheFromStorage(companyId));
    }
  }, [companyId]);

  const storeCache = useCallback((id: string, nextFiles: DriveFile[]) => {
    setCache((prev) => ({
      ...prev,
      [id]: { files: nextFiles, timestamp: Date.now() },
    }));
  }, []);

  const invalidateCache = useCallback((targetFolderId?: string) => {
    const id = targetFolderId || currentPath[currentPath.length - 1]?.id || folderId;
    if (!id) return;
    setCache((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [currentPath, folderId]);

  const ensureFolder = useCallback(async () => {
    if (!user || !companyId || !companyName) return null;
    try {
      const res = await fetch(getFunctionUrl('ensure_folder'), {
        method: 'POST',
        headers: await getAuthHeaders('application/json'),
        body: JSON.stringify({ company_id: companyId, company_name: companyName }),
      });
      const data = (await res.json()) as DriveResponse;
      if (!res.ok || !data?.folder_id) {
        throw new Error(data?.error || 'Google Drive não retornou a pasta da empresa');
      }
      return data.folder_id;
    } catch (error) {
      console.error('[GoogleDrive] ensureFolder failed', error);
      toast.error('Erro ao conectar com Google Drive');
      return null;
    }
  }, [user, companyId, companyName]);

  // SWR fetch: show cached immediately, refresh in background
  const fetchFiles = useCallback(async (targetFolderId?: string, options: { force?: boolean } = {}) => {
    const id = targetFolderId || folderId;
    if (!id) return [] as DriveFile[];

    // 1. Show cached data immediately (any age)
    const cached = cache[id];
    if (cached && !options.force) {
      if (mountedRef.current) {
        setFiles(cached.files);
        setLoading(false);
        setSyncing(true); // show background indicator
      }
    } else if (!cached) {
      if (mountedRef.current) setLoading(true);
    }

    // 2. Fetch fresh data in background
    try {
      const res = await fetch(getFunctionUrl('list', { folder_id: id }), {
        headers: await getAuthHeaders(),
      });
      const data = (await res.json()) as DriveResponse;
      if (!res.ok) throw new Error(data?.error || 'Erro ao listar arquivos');

      const freshFiles = data?.files || [];

      if (mountedRef.current) {
        // Only update UI if data actually changed
        const cacheStr = JSON.stringify(cached?.files || []);
        const freshStr = JSON.stringify(freshFiles);
        if (cacheStr !== freshStr || options.force) {
          setFiles(freshFiles);
        }
        storeCache(id, freshFiles);
      }
      return freshFiles;
    } catch (error) {
      console.error('[GoogleDrive] fetchFiles failed', error);
      if (!cached) toast.error('Erro ao listar arquivos');
      return cached?.files || ([] as DriveFile[]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setSyncing(false);
      }
    }
  }, [folderId, cache, storeCache]);

  // Prefetch visible subfolders in background
  const prefetchSubfolders = useCallback(async (fileList: DriveFile[]) => {
    const folders = fileList.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    for (const folder of folders) {
      const cached = cache[folder.id];
      if (cached && Date.now() - cached.timestamp < PREFETCH_TTL) continue;

      try {
        const res = await fetch(getFunctionUrl('list', { folder_id: folder.id }), {
          headers: await getAuthHeaders(),
        });
        const data = (await res.json()) as DriveResponse;
        if (data?.files) {
          storeCache(folder.id, data.files);
        }
      } catch {}

      await new Promise(r => setTimeout(r, 500));
    }
  }, [cache, storeCache]);

  // Init: ensure folder + fetch with SWR
  useEffect(() => {
    if (!companyId || !companyName) {
      setFiles([]);
      setFolderId(null);
      setCurrentPath([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const id = await ensureFolder();
      if (!id || cancelled || !mountedRef.current) {
        if (!cancelled && mountedRef.current) setLoading(false);
        return;
      }

      setFolderId(id);
      setCurrentPath([{ id, name: companyName }]);

      // Show cache immediately
      const rootCache = cache[id];
      if (rootCache) {
        setFiles(rootCache.files);
        setLoading(false);
      }

      const freshFiles = await fetchFiles(id, rootCache ? {} : { force: true });
      // Prefetch subfolders after initial load
      if (freshFiles && freshFiles.length > 0 && !cancelled) {
        prefetchSubfolders(freshFiles);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companyName]);

  const uploadFile = useCallback(async (file: File) => {
    const targetFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    if (!targetFolder) {
      toast.error('Pasta do Google Drive não encontrada');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', targetFolder);

    try {
      const res = await fetch(getFunctionUrl('upload'), {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      toast.success(`${file.name} enviado!`);
      invalidateCache(targetFolder);
      await fetchFiles(targetFolder, { force: true });
    } catch (error) {
      console.error('[GoogleDrive] upload failed', error);
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  }, [folderId, currentPath, fetchFiles, invalidateCache]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  // Upload directly to a specific folder (for drop-on-folder)
  const uploadToFolder = useCallback(async (fileList: FileList | File[], targetFolderId: string) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', targetFolderId);

      try {
        const res = await fetch(getFunctionUrl('upload'), {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Upload failed');
        toast.success(`${file.name} enviado!`);
      } catch (error) {
        console.error('[GoogleDrive] uploadToFolder failed', error);
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    setUploading(false);

    // Invalidate cache of target folder
    invalidateCache(targetFolderId);

    // If we're currently viewing the target folder, refresh
    const currentFolderIdNow = currentPath[currentPath.length - 1]?.id;
    if (currentFolderIdNow === targetFolderId) {
      await fetchFiles(targetFolderId, { force: true });
    }
  }, [currentPath, fetchFiles, invalidateCache]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(getFunctionUrl('delete'), {
        method: 'POST',
        headers: await getAuthHeaders('application/json'),
        body: JSON.stringify({ file_id: fileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao deletar');
    } catch (error) {
      console.error('[GoogleDrive] delete failed', error);
      toast.error('Erro ao deletar');
      return;
    }
    toast.success('Arquivo removido');
    const targetFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    invalidateCache(targetFolder || undefined);
    await fetchFiles(targetFolder || undefined, { force: true });
  }, [folderId, currentPath, fetchFiles, invalidateCache]);

  const createSubfolder = useCallback(async (folderName: string) => {
    const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    if (!parentId) {
      toast.error('Pasta raiz do Google Drive não encontrada');
      return;
    }
    try {
      const res = await fetch(getFunctionUrl('create_folder'), {
        method: 'POST',
        headers: await getAuthHeaders('application/json'),
        body: JSON.stringify({ folder_name: folderName, parent_id: parentId }),
      });
      const data = (await res.json()) as DriveResponse;
      if (!res.ok || !data?.folder_id) throw new Error(data?.error || 'Google Drive não retornou a nova pasta');

      toast.success(`Pasta "${folderName}" criada`);
      invalidateCache(parentId);
      await fetchFiles(parentId, { force: true });
      return data.folder_id;
    } catch (error) {
      console.error('[GoogleDrive] createSubfolder failed', error);
      toast.error('Erro ao criar pasta');
    }
  }, [folderId, currentPath, fetchFiles, invalidateCache]);

  const openFolder = useCallback(async (folder: DriveFile) => {
    const nextPathItem = { id: folder.id, name: folder.name };
    const cached = cache[folder.id];

    setCurrentPath((prev) => [...prev, nextPathItem]);

    if (cached) {
      setFiles(cached.files);
      setLoading(false);
      // Still refresh in background
      setSyncing(true);
      fetchFiles(folder.id).then(() => {
        if (mountedRef.current) setSyncing(false);
      });
      return;
    }

    await fetchFiles(folder.id);
  }, [fetchFiles, cache]);

  const goBack = useCallback(async () => {
    if (currentPath.length <= 1) return;
    const newPath = currentPath.slice(0, -1);
    const parentId = newPath[newPath.length - 1]?.id;
    if (!parentId) return;

    const cached = cache[parentId];
    setCurrentPath(newPath);

    if (cached) {
      setFiles(cached.files);
      setLoading(false);
      setSyncing(true);
      fetchFiles(parentId).then(() => {
        if (mountedRef.current) setSyncing(false);
      });
      return;
    }
    await fetchFiles(parentId);
  }, [currentPath, fetchFiles, cache]);

  const goToPathIndex = useCallback(async (index: number) => {
    if (index < 0 || index >= currentPath.length) return;
    const newPath = currentPath.slice(0, index + 1);
    const targetId = newPath[newPath.length - 1]?.id;
    if (!targetId) return;

    const cached = cache[targetId];
    setCurrentPath(newPath);

    if (cached) {
      setFiles(cached.files);
      setLoading(false);
      setSyncing(true);
      fetchFiles(targetId).then(() => {
        if (mountedRef.current) setSyncing(false);
      });
      return;
    }
    await fetchFiles(targetId);
  }, [currentPath, fetchFiles, cache]);

  return {
    files,
    loading,
    uploading,
    syncing,
    folderId,
    currentPath,
    fetchFiles,
    uploadFile,
    uploadFiles,
    uploadToFolder,
    deleteFile,
    createSubfolder,
    openFolder,
    goBack,
    goToPathIndex,
  };
}
