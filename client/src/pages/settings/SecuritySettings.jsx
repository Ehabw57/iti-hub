import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useChangePassword } from '@hooks/mutations/useCourseMutations';

export default function SecuritySettings() {
  const content = useIntlayer('settings');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error(content.passwordMinLength.value);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(content.passwordsMismatch.value);
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success(content.passwordSuccess.value);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-heading-5">{content.changePassword.value}</h2>

      {/* Current Password */}
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.currentPassword.value}
        </label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={content.currentPasswordPlaceholder.value}
          required
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.newPassword.value}
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={content.newPasswordPlaceholder.value}
          required
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.confirmPassword.value}
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={content.confirmPasswordPlaceholder.value}
          required
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {changePasswordMutation.isPending && (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
          )}
          {changePasswordMutation.isPending ? content.updatingPassword.value : content.updatePassword.value}
        </button>
      </div>
    </form>
  );
}
