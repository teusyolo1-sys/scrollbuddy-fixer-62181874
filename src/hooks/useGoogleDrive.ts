import { useState, useEffect, useCallback } from 'react';
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

export function useGoogleDrive(companyId?: string, companyName?: string) {
  const { user } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);

  const ensureFolder = useCallback(async () => {
    if (!user || !companyId || !companyName) return null;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const session = (await supabase.auth.getSession()).data.session;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-drive?action=ensure_folder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ company_id: companyId, company_name: companyName }),
        }
      );
      const data = await res.json();
      if (!res.ok) { toast.error('Erro ao conectar com Google Drive'); return null; }
      return data?.folder_id || null;
    } catch {
      toast.error('Erro ao conectar com Google Drive');
      return null;
    }
    return data?.folder_id || null;
  }, [user, companyId, companyName]);

  const fetchFiles = useCallback(async (targetFolderId?: string) => {
    const id = targetFolderId || folderId;
    if (!id) return;
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-drive?action=list&folder_id=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      setFiles(data?.files || []);
    } catch {
      toast.error('Erro ao listar arquivos');
    }
    setLoading(false);
  }, [folderId]);

  useEffect(() => {
    if (!companyId || !companyName) return;
    (async () => {
      const id = await ensureFolder();
      if (id) {
        setFolderId(id);
        setCurrentPath([{ id, name: companyName }]);
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const session = (await supabase.auth.getSession()).data.session;
        try {
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/google-drive?action=list&folder_id=${id}`,
            {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
          const data = await res.json();
          setFiles(data?.files || []);
        } catch {}
      }
      setLoading(false);
    })();
  }, [companyId, companyName, ensureFolder]);

  const uploadFile = useCallback(async (file: File) => {
    const targetFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    if (!targetFolder) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', targetFolder);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-drive?action=upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );
      if (!res.ok) throw new Error('Upload failed');
      toast.success(`${file.name} enviado!`);
      await fetchFiles(targetFolder);
    } catch {
      toast.error('Erro no upload');
    }
    setUploading(false);
  }, [folderId, currentPath, fetchFiles]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    for (const file of arr) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const deleteFile = useCallback(async (fileId: string) => {
    const { error } = await supabase.functions.invoke('google-drive', {
      body: { file_id: fileId },
      headers: { 'x-action': 'delete' },
    });
    if (error) { toast.error('Erro ao deletar'); return; }
    toast.success('Arquivo removido');
    const targetFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    await fetchFiles(targetFolder || undefined);
  }, [folderId, currentPath, fetchFiles]);

  const createSubfolder = useCallback(async (folderName: string) => {
    const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    if (!parentId) return;
    const { data, error } = await supabase.functions.invoke('google-drive', {
      body: { folder_name: folderName, parent_id: parentId },
      headers: { 'x-action': 'create_folder' },
    });
    if (error) { toast.error('Erro ao criar pasta'); return; }
    toast.success(`Pasta "${folderName}" criada`);
    await fetchFiles(parentId);
    return data?.folder_id;
  }, [folderId, currentPath, fetchFiles]);

  const openFolder = useCallback(async (folder: DriveFile) => {
    setCurrentPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    await fetchFiles(folder.id);
  }, [fetchFiles]);

  const goBack = useCallback(async () => {
    if (currentPath.length <= 1) return;
    const newPath = currentPath.slice(0, -1);
    setCurrentPath(newPath);
    await fetchFiles(newPath[newPath.length - 1].id);
  }, [currentPath, fetchFiles]);

  return {
    files, loading, uploading, folderId, currentPath,
    fetchFiles, uploadFile, uploadFiles, deleteFile,
    createSubfolder, openFolder, goBack,
  };
}
