import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineFolderPlus,
  HiOutlineArrowUpTray,
  HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import { useTrackFiles, useTrackFolders } from '@hooks/queries/useCourse';
import {
  useCreateTrackFolder,
  useUpdateTrackFolder,
  useDeleteTrackFolder,
  useUploadTrackFile,
  useDeleteTrackFile,
} from '@hooks/mutations/useCourseMutations';
import api from '@lib/api';
import { Loading } from '@components/common';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ContentTable from './ContentTable';
import { getFileVisual } from './fileIcons';
import { NameDialog, WorkspaceToolbar } from './FolderShared';

/**
 * Files tab — SharePoint-style (reissued work order §1). The track's Files-tab
 * folders (kind 'files' — a list fully independent from the Records tab's)
 * and uploads render in one sortable table (folders always first); managers
 * create / rename / delete folders, upload into any folder and delete files.
 * Students keep view / download-only access.
 */
export default function FilesTab({ trackId, isManager, t }) {
  const { data, isLoading } = useTrackFiles(trackId);
  // This tab's own folders only (kind 'files') — fully independent of Records
  const { data: foldersData } = useTrackFolders(trackId, 'files');

  const createFolderMutation = useCreateTrackFolder();
  const renameFolderMutation = useUpdateTrackFolder();
  const deleteFolderMutation = useDeleteTrackFolder();
  const uploadMutation = useUploadTrackFile();
  const deleteFileMutation = useDeleteTrackFile();

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [nameDialog, setNameDialog] = useState(null); // null | { mode:'create' } | { mode:'rename', folder }
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadShared, setUploadShared] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type:'file'|'folder', id, name }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loading />
      </div>
    );
  }

  const folders = foldersData?.data?.data?.folders ?? [];
  const files = data?.data?.data?.files ?? [];
  const currentFolder = folders.find((f) => String(f._id) === String(activeFolderId)) || null;
  // Root lists every folder plus the loose (unassigned) files; inside a
  // folder only that folder's files show — SharePoint behaviour.
  const visibleFiles = currentFolder
    ? files.filter((f) => String(f.folderId || '') === String(currentFolder._id))
    : files.filter((f) => !f.folderId);

  const handleNameSubmit = async (name) => {
    try {
      if (nameDialog?.mode === 'rename') {
        await renameFolderMutation.mutateAsync({ folderId: nameDialog.folder._id, name });
        toast.success(t('folderRenamed', 'Folder renamed'));
      } else {
        await createFolderMutation.mutateAsync({ trackId, name, kind: 'files' });
        toast.success(t('folderCreated', 'Folder created'));
      }
      setNameDialog(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message ||
          (nameDialog?.mode === 'rename'
            ? t('folderRenameError', 'Failed to rename folder')
            : t('folderCreateError', 'Failed to create folder'))
      );
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      await uploadMutation.mutateAsync({
        trackId,
        file: uploadFile,
        isShared: uploadShared,
        folderId: uploadFolder || null,
      });
      toast.success(t('fileUploaded', 'File uploaded'));
      setUploadFile(null);
      setUploadFolder('');
      setUploadShared(false);
      setShowUploadForm(false);
      // Reset the native input so picking the same file again re-fires onChange
      e.target.reset();
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message || t('fileUploadError', 'Failed to upload file')
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'folder') {
        await deleteFolderMutation.mutateAsync({ folderId: confirm.id });
        // Deleting the folder we're inside of drops us back to the root
        if (String(confirm.id) === String(activeFolderId)) setActiveFolderId(null);
      } else {
        await deleteFileMutation.mutateAsync({ id: confirm.id });
      }
      toast.success(t('deleted', 'Deleted'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('deleteError', 'Failed to delete'));
    }
  };

  // Blob download — fetches the file and saves it via a temporary <a download>
  // link instead of navigating to it. The name link still previews in a new tab.
  const handleDownloadFile = async (file) => {
    try {
      const { data: blob } = await api.get(file.fileUrl, {
        responseType: 'blob',
        timeout: 60000,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message || t('downloadError', 'Failed to download file')
      );
    }
  };

  // Table rows — ContentTable keeps folders grouped at the top
  const rows = [
    // Root lists every folder; inside a folder only its own files show
    ...(currentFolder ? [] : folders.map((folder) => ({
      id: folder._id,
      name: folder.name,
      isFolder: true,
      icon: HiOutlineFolder,
      iconTile: 'bg-warning-600/10 text-warning-600',
      secondary: `${folder.fileCount || 0} ${t('folderCount', 'files')}`,
      modifiedAt: folder.createdAt,
      modifiedBy: folder.createdBy || null,
      onOpen: () => setActiveFolderId(folder._id),
      ...(isManager && {
        onEdit: () => setNameDialog({ mode: 'rename', folder }),
        editLabel: t('renameFolder', 'Rename folder'),
        onDelete: () => setConfirm({ type: 'folder', id: folder._id, name: folder.name }),
        deleteLabel: t('deleteFolder', 'Delete folder'),
      }),
    }))),
    ...visibleFiles.map((file) => {
      const visual = getFileVisual(file.fileName, file.fileType);
      return {
        id: file._id,
        name: file.fileName,
        isFolder: false,
        icon: visual.icon,
        iconTile: visual.tile,
        modifiedAt: file.uploadedAt,
        modifiedBy: file.uploadedBy || null,
        href: file.fileUrl,
        onDownload: () => handleDownloadFile(file),
        openLabel: t('download', 'Download'),
        openIcon: HiOutlineDocumentArrowDown,
        ...(isManager && {
          onDelete: () => setConfirm({ type: 'file', id: file._id, name: file.fileName }),
          deleteLabel: t('deleteFile', 'Delete file'),
        }),
      };
    }),
  ];

  return (
    <div>
      <WorkspaceToolbar
        rootLabel={t('tabFiles', 'Files')}
        folder={currentFolder}
        onNavigateRoot={() => setActiveFolderId(null)}
        actions={
          isManager ? (
            <>
              {!currentFolder && (
                <button
                  type="button"
                  onClick={() => setNameDialog({ mode: 'create' })}
                  className="flex items-center gap-2 px-3.5 h-9 border border-outline text-neutral-700 rounded-xl text-caption font-semibold hover:bg-surface-high transition-colors"
                >
                  <HiOutlineFolderPlus className="w-4 h-4" />
                  {t('createFolder', 'Create folder')}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  // Uploads start in the folder being viewed (switchable below)
                  setUploadFolder(currentFolder?._id || '');
                  setShowUploadForm(true);
                }}
                className="flex items-center gap-2 px-3.5 h-9 bg-primary-600 text-white rounded-xl text-caption font-semibold hover:bg-primary-700 transition-colors"
              >
                <HiOutlineArrowUpTray className="w-4 h-4" />
                {t('uploadFile', 'Upload file')}
              </button>
            </>
          ) : undefined
        }
      />

      {/* Upload form (managers) */}
      {isManager && showUploadForm && (
        <form
          onSubmit={handleUpload}
          className="mb-4 bg-surface-lowest border border-outline rounded-xl p-4 flex flex-col gap-3"
        >
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="text-body-2 text-neutral-600 cursor-pointer file:mx-3 file:px-3 file:h-9 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:text-sm file:font-semibold file:cursor-pointer"
            required
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex flex-col gap-1 text-caption text-neutral-500">
              {t('folderLabel', 'Folder')}
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
              >
                <option value="">{t('rootLevel', 'Track root (no folder)')}</option>
                {folders.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-body-2 text-neutral-600 sm:self-end sm:pb-2.5">
              <input
                type="checkbox"
                checked={uploadShared}
                onChange={(e) => setUploadShared(e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />
              {t('markShared', 'Add to the shared resource library')}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploadMutation.isPending || !uploadFile}
              className="px-4 h-9 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending
                ? t('uploading', 'Uploading...')
                : t('uploadFile', 'Upload file')}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-4 h-9 border border-outline text-neutral-600 rounded-xl text-sm hover:bg-surface-high transition-colors"
            >
              {t('cancel', 'Cancel')}
            </button>
          </div>
        </form>
      )}

      <ContentTable
        rows={rows}
        columnName={t('columnName', 'Name')}
        columnModified={t('columnModified', 'Modified')}
        columnModifiedBy={t('columnModifiedBy', 'Modified By')}
        emptyIcon={HiOutlineFolderOpen}
        emptyTitle={
          currentFolder ? t('folderEmpty', 'This folder is empty') : t('filesEmpty', 'No files yet.')
        }
      />

      {/* Create / rename folder dialog (managers) */}
      <NameDialog
        isOpen={!!nameDialog}
        onClose={() => setNameDialog(null)}
        title={
          nameDialog?.mode === 'rename'
            ? t('renameFolder', 'Rename folder')
            : t('createFolder', 'Create folder')
        }
        label={t('folderName', 'Folder name')}
        initialValue={nameDialog?.mode === 'rename' ? nameDialog.folder.name : ''}
        submitLabel={
          nameDialog?.mode === 'rename' ? t('save', 'Save') : t('createFolder', 'Create folder')
        }
        cancelLabel={t('cancel', 'Cancel')}
        pending={createFolderMutation.isPending || renameFolderMutation.isPending}
        onSubmit={handleNameSubmit}
      />

      {/* Delete confirmation (file / folder) */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        variant="danger"
        title={t('confirmDeleteTitle', 'Delete?')}
        message={
          confirm?.type === 'folder'
            ? t('confirmDeleteFolder', 'Files inside will be kept and moved to the track root.')
            : t('confirmDeleteFile', 'This file will be permanently removed.')
        }
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
      />
    </div>
  );
}


