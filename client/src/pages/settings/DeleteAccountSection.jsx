import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { useDeleteAccount } from '@hooks/mutations/useCourseMutations';
import { useAuthStore } from '@/store/auth';
import settingsContent from '@/content/settings/settings.content';

export default function DeleteAccountSection() {
  const content = useIntlayer(settingsContent.key);
  const [password, setPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const deleteMutation = useDeleteAccount();

  const handleDelete = async () => {
    if (!password) {
      toast.error(content.deleteConfirm.value);
      return;
    }
    try {
      await deleteMutation.mutateAsync(password);
      toast.success(content.deleteSuccess.value);
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-5">
      <div className="border border-error/30 rounded-lg p-6 bg-error/5">
        <h2 className="text-heading-5 text-error mb-2">{content.dangerZone.value}</h2>
        <p className="text-body-1 text-neutral-700 mb-4">{content.deleteAccountDesc.value}</p>

        <div className="mb-4">
          <label htmlFor="deletePassword" className="block text-sm font-medium text-neutral-700 mb-2">
            {content.deleteConfirm.value}
          </label>
          <input
            id="deletePassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!password || deleteMutation.isPending}
          className="px-6 py-2.5 bg-error text-white rounded-lg hover:bg-error-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {content.deleteButton.value}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={content.deleteAccount.value}
        message={content.deleteWarning.value}
        confirmText={content.deleteButton.value}
        variant="danger"
      />
    </div>
  );
}
