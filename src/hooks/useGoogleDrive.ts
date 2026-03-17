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

interface DriveResponse {
  folder_id?: string;
  files?: DriveFile[];
  error?: string;
}

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

export function useGoogleDrive(companyId?: string, companyName?: string) {
  const { user } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);

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

  const fetchFiles = useCallback(async (targetFolderId?: string) => {
    const id = targetFolderId || folderId;
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch(getFunctionUrl('list', { folder_id: id }), {
        headers: await getAuthHeaders(),
      });

      const data = (await res.json()) as DriveResponse;

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao listar arquivos');
      }

      setFiles(data?.files || []);
    } catch (error) {
      console.error('[GoogleDrive] fetchFiles failed', error);
      toast.error('Erro ao listar arquivos');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (!companyId || !companyName) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const id = await ensureFolder();

      if (!id || cancelled) {
        setLoading(false);
        return;
      }

      setFolderId(id);
      setCurrentPath([{ id, name: companyName }]);

      try {
        const res = await fetch(getFunctionUrl('list', { folder_id: id }), {
          headers: await getAuthHeaders(),
        });

        const data = (await res.json()) as DriveResponse;

        if (!res.ok) {
          throw new Error(data?.error || 'Erro ao listar arquivos');
        }

        if (!cancelled) {
          setFiles(data?.files || []);
        }
      } catch (error) {
        console.error('[GoogleDrive] initial list failed', error);
        if (!cancelled) {
          toast.error('Erro ao listar arquivos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, companyName, ensureFolder]);

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

      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed');
      }

      toast.success(`${file.name} enviado!`);
      await fetchFiles(targetFolder);
    } catch (error) {
      console.error('[GoogleDrive] upload failed', error);
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  }, [folderId, currentPath, fetchFiles]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(getFunctionUrl('delete'), {
        method: 'POST',
        headers: await getAuthHeaders('application/json'),
        body: JSON.stringify({ file_id: fileId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao deletar');
      }
    } catch (error) {
      console.error('[GoogleDrive] delete failed', error);
      toast.error('Erro ao deletar');
      return;
    }

    toast.success('Arquivo removido');
    const targetFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : folderId;
    await fetchFiles(targetFolder || undefined);
  }, [folderId, currentPath, fetchFiles]);

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

      if (!res.ok || !data?.folder_id) {
        throw new Error(data?.error || 'Google Drive não retornou a nova pasta');
      }

      toast.success(`Pasta "${folderName}" criada`);
      await fetchFiles(parentId);
      return data.folder_id;
    } catch (error) {
      console.error('[GoogleDrive] createSubfolder failed', error);
      toast.error('Erro ao criar pasta');
    }
  }, [folderId, currentPath, fetchFiles]);

  const openFolder = useCallback(async (folder: DriveFile) => {
    setCurrentPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    await fetchFiles(folder.id);
  }, [fetchFiles]);

  const goBack = useCallback(async () => {
    if (currentPath.length <= 1) return;
    const newPath = currentPath.slice(0, -1);
    setCurrentPath(newPath);
    await fetchFiles(newPath[newPath.length - 1].id);
  }, [currentPath, fetchFiles]);

  return {
    files,
    loading,
    uploading,
    folderId,
    currentPath,
    fetchFiles,
    uploadFile,
    uploadFiles,
    deleteFile,
    createSubfolder,
    openFolder,
    goBack,
  };
}
