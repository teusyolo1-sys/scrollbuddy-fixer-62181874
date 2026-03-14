import { create } from 'zustand';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface Section {
  id: string;
  tag: string;
  name: string;
}

export interface ElementProps {
  id: string;
  tag: string;
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  textAlign: string;
  lineHeight: string;
  letterSpacing: string;
  width: string;
  height: string;
  padding: string;
  margin: string;
  borderRadius: string;
  opacity: string;
}

interface EditorState {
  // File state
  isFileLoaded: boolean;
  fileName: string;
  zipFiles: Record<string, Blob>;
  blobMap: Record<string, string>;
  newImages: Record<string, Blob>;

  // Edit state
  editMode: boolean;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  selectedElementProps: ElementProps | null;
  sections: Section[];
  
  // Device
  deviceMode: DeviceMode;
  
  // UI panels
  structurePanelOpen: boolean;
  structureDocked: boolean;
  structureMinimized: boolean;
  propertiesPanelOpen: boolean;

  // History
  history: string[];
  
  // iframe HTML
  currentHtml: string;

  // Actions
  setFileLoaded: (fileName: string) => void;
  closeFile: () => void;
  toggleEditMode: () => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setSelectedSection: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
  setSelectedElementProps: (props: ElementProps | null) => void;
  setSections: (sections: Section[]) => void;
  setZipFiles: (files: Record<string, Blob>) => void;
  setBlobMap: (map: Record<string, string>) => void;
  setCurrentHtml: (html: string) => void;
  pushHistory: (html: string) => void;
  undo: () => string | null;
  toggleStructurePanel: () => void;
  toggleStructureDock: () => void;
  toggleStructureMinimize: () => void;
  togglePropertiesPanel: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isFileLoaded: false,
  fileName: '',
  zipFiles: {},
  blobMap: {},
  newImages: {},
  editMode: false,
  selectedSectionId: null,
  selectedElementId: null,
  selectedElementProps: null,
  sections: [],
  deviceMode: 'desktop',
  structurePanelOpen: false,
  structureDocked: false,
  structureMinimized: false,
  propertiesPanelOpen: false,
  history: [],
  currentHtml: '',

  setFileLoaded: (fileName) => set({ isFileLoaded: true, fileName, editMode: false }),
  closeFile: () => set({
    isFileLoaded: false, fileName: '', zipFiles: {}, blobMap: {},
    newImages: {}, editMode: false, selectedSectionId: null, selectedElementId: null,
    selectedElementProps: null, sections: [], history: [], currentHtml: '',
    structurePanelOpen: false, structureDocked: false, structureMinimized: false, propertiesPanelOpen: false,
  }),
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  setSelectedSection: (id) => set({ selectedSectionId: id, selectedElementId: null }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  setSelectedElementProps: (props) => set({ selectedElementProps: props }),
  setSections: (sections) => set({ sections }),
  setZipFiles: (files) => set({ zipFiles: files }),
  setBlobMap: (map) => set({ blobMap: map }),
  setCurrentHtml: (html) => set({ currentHtml: html }),
  pushHistory: (html) => set((s) => {
    const h = [...s.history, html];
    if (h.length > 30) h.shift();
    return { history: h };
  }),
  undo: () => {
    const { history } = get();
    if (history.length <= 1) return null;
    const newHistory = history.slice(0, -1);
    set({ history: newHistory });
    return newHistory[newHistory.length - 1];
  },
  toggleStructurePanel: () => set((s) => ({ structurePanelOpen: !s.structurePanelOpen })),
  toggleStructureDock: () => set((s) => ({ structureDocked: !s.structureDocked })),
  toggleStructureMinimize: () => set((s) => ({ structureMinimized: !s.structureMinimized })),
  togglePropertiesPanel: () => set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
}));
