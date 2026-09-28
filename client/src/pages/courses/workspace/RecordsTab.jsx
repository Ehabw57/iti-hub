import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineFolderPlus,
  HiOutlinePlus,
  HiOutlineVideoCamera,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { useTrackRecords, useTrackFolders } from '@hooks/queries/useCourse';
import {
  useCreateTrackRecord,
  useUpdateTrackRecord,
  useDeleteTrackRecord,
  useCreateTrackFolder,
  useUpdateTrackFolder,
  useDeleteTrackFolder,
} from '@hooks/mutations/useCourseMutations';
import { Loading } from '@components/common';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ContentTable from './ContentTable';
import { NameDialog, WorkspaceToolbar } from './FolderShared';

/**
 * Records tab — SharePoint-style (reissued work order §1). Session
 * recordings / Teams meeting links live in this tab's own folders (kind
 * 'records' — a list fully independent from the Files tab's): managers
 * create, rename and delete folders, add records into any folder and edit /
 * delete records; members browse by folder and open links.
 */
export default function RecordsTab({ trackId, isManager, t }) {
  const { data, isLoading } = useTrackRecords(trackId);
  // This tab's own folders only (kind 'records') — fully independent of Files
  const { data: foldersData } = useTrackFolders(trackId, 'records');

  const createRecordMutation = useCreateTrackRecord();
  const updateRecordMutation = useUpdateTrackRecord();
  const deleteRecordMutation = useDeleteTrackRecord();
  const createFolderMutation = useCreateTrackFolder();
  const renameFolderMutation = useUpdateTrackFolder();
  const deleteFolderMutation = useDeleteTrackFolder();

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [nameDialog, setNameDialog] = useState(null); // null | { mode:'create' } | { mode:'rename', folder }
  const [recordDialog, setRecordDialog] = useState(null); // null | { mode:'create' } | { mode:'edit', record }
  const [confirm, setConfirm] = useState(null); // { type:'record'|'folder', id, name }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loading />
      </div>
    );
  }

  const folders = foldersData?.data?.data?.folders ?? [];
  const records = data?.data?.data?.records ?? [];
  const currentFolder = folders.find((f) => String(f._id) === String(activeFolderId)) || null;
  // Root lists every folder plus the loose (unassigned) records; inside a
  // folder only that folder's records show — same behaviour as Files.
  const visibleRecords = currentFolder
    ? records.filter((r) => String(r.folderId || '') === String(currentFolder._id))
    : records.filter((r) => !r.folderId);

  const handleNameSubmit = async (name) => {
    try {
      if (nameDialog?.mode === 'rename') {
        await renameFolderMutation.mutateAsync({ folderId: nameDialog.folder._id, name });
        toast.success(t('folderRenamed', 'Folder renamed'));
      } else {
        await createFolderMutation.mutateAsync({ trackId, name, kind: 'records' });
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

  const handleRecordSubmit = async (form) => {
    try {
      if (recordDialog?.mode === 'edit') {
        await updateRecordMutation.mutateAsync({ recordId: recordDialog.record._id, ...form });
        toast.success(t('recordUpdated', 'Record updated'));
      } else {
        await createRecordMutation.mutateAsync({ trackId, ...form });
        toast.success(t('recordAdded', 'Record added'));
      }
      setRecordDialog(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message || t('recordSaveError', 'Failed to save record')
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
        await deleteRecordMutation.mutateAsync({ recordId: confirm.id });
      }
      toast.success(t('deleted', 'Deleted'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('deleteError', 'Failed to delete'));
    }
  };

  // Table rows — folders first (ContentTable groups them at the top)
  const rows = [
    // Root lists every folder; inside a folder only its own records show
    ...(currentFolder ? [] : folders.map((folder) => ({
      id: folder._id,
      name: folder.name,
      isFolder: true,
      icon: HiOutlineFolder,
      iconTile: 'bg-warning-600/10 text-warning-600',
      secondary: `${folder.recordCount || 0} ${t('recordCountLabel', 'records')}`,
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
    ...visibleRecords.map((record) => ({
      id: record._id,
      name: record.title,
      isFolder: false,
      icon: HiOutlineVideoCamera,
      iconTile: 'bg-secondary-600/10 text-secondary-600',
      secondary: record.description || '',
      modifiedAt: record.sessionDate || record.createdAt,
      modifiedBy: record.createdBy || null,
      href: record.teamsUrl,
      openLabel: t('openRecord', 'Open link'),
      openIcon: HiOutlineArrowTopRightOnSquare,
      ...(isManager && {
        onEdit: () => setRecordDialog({ mode: 'edit', record }),
        editLabel: t('editRecord', 'Edit record'),
        onDelete: () => setConfirm({ type: 'record', id: record._id, name: record.title }),
        deleteLabel: t('deleteRecord', 'Delete record'),
      }),
    })),
  ];

  return (
    <div>
      <WorkspaceToolbar
        rootLabel={t('tabRecords', 'Records')}
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
                onClick={() => setRecordDialog({ mode: 'create' })}
                className="flex items-center gap-2 px-3.5 h-9 bg-primary-600 text-white rounded-xl text-caption font-semibold hover:bg-primary-700 transition-colors"
              >
                <HiOutlinePlus className="w-4 h-4" />
                {t('addRecord', 'Add record')}
              </button>
            </>
          ) : undefined
        }
      />

      <ContentTable
        rows={rows}
        columnName={t('columnName', 'Name')}
        columnModified={t('columnModified', 'Modified')}
        columnModifiedBy={t('columnModifiedBy', 'Modified By')}
        emptyIcon={HiOutlineFolderOpen}
        emptyTitle={
          currentFolder
            ? t('folderEmpty', 'This folder is empty')
            : t('recordsEmpty', 'No session records yet.')
        }
        emptyHint={
          currentFolder ? undefined : t('recordsHint', 'Session recordings and Teams meeting links.')
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

      {/* Create / edit record dialog (managers) */}
      <RecordDialog
        isOpen={!!recordDialog}
        onClose={() => setRecordDialog(null)}
        folders={folders}
        initial={recordDialog?.mode === 'edit' ? recordDialog.record : null}
        pending={createRecordMutation.isPending || updateRecordMutation.isPending}
        onSubmit={handleRecordSubmit}
        t={t}
      />

      {/* Delete confirmation (record / folder) */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        variant="danger"
        title={t('confirmDeleteTitle', 'Delete?')}
        message={
          confirm?.type === 'folder'
            ? t(
                'confirmDeleteFolderRecords',
                'Records inside will be kept and moved to the track root.'
              )
            : t('confirmDeleteRecord', 'This record will be permanently removed.')
        }
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
      />
    </div>
  );
}

/**
 * Create / edit record dialog (managers). Collects the record fields plus
 * the folder assignment; on edit it starts from the record's own values.
 */
function RecordDialog({ isOpen, onClose, folders, initial, pending, onSubmit, t }) {
  const [title, setTitle] = useState('');
  const [teamsUrl, setTeamsUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [folderId, setFolderId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || '');
      setTeamsUrl(initial?.teamsUrl || '');
      setDescription(initial?.description || '');
      setSessionDate(initial?.sessionDate ? initial.sessionDate.slice(0, 10) : '');
      setFolderId(initial?.folderId ? String(initial.folderId) : '');
    }
  }, [isOpen, initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !teamsUrl.trim()) return;
    onSubmit({
      title: title.trim(),
      teamsUrl: teamsUrl.trim(),
      description: description.trim(),
      sessionDate: sessionDate || null,
      folderId: folderId || null,
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-neutral-100 rounded-lg shadow-elevation-3 p-6">
          <DialogTitle className="text-heading-6 font-bold text-neutral-900 mb-4">
            {initial ? t('editRecord', 'Edit record') : t('addRecord', 'Add record')}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('recordTitle', 'Record title')}
              aria-label={t('recordTitle', 'Record title')}
              required
              autoFocus
              className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
            />
            <input
              type="url"
              value={teamsUrl}
              onChange={(e) => setTeamsUrl(e.target.value)}
              placeholder={t('recordUrl', 'Teams / meeting link')}
              aria-label={t('recordUrl', 'Teams / meeting link')}
              required
              className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('recordDescription', 'Description (optional)')}
              aria-label={t('recordDescription', 'Description (optional)')}
              className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 flex flex-col gap-1 text-caption text-neutral-500">
                {t('sessionDate', 'Session date')}
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1 text-caption text-neutral-500">
                {t('folderLabel', 'Folder')}
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
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
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-9 border border-outline text-neutral-600 rounded-xl text-sm hover:bg-surface-high transition-colors"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-4 h-9 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {t('save', 'Save')}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}


