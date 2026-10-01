import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useUpdateNotificationPreferences } from '@hooks/mutations/useCourseMutations';

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-4 p-4 bg-surface-lowest border border-outline rounded-lg cursor-pointer hover:bg-surface-low transition-colors">
      <div className="flex-1">
        <p className="text-body-1 text-neutral-900 font-medium">{label}</p>
        {description && (
          <p className="text-body-2 text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function NotificationSettings({ user }) {
  const content = useIntlayer('settings');
  const prefs = user?.notificationPreferences || {
    email: true,
    push: true,
    mentions: true,
    messages: true,
    communityUpdates: true,
  };

  const [localPrefs, setLocalPrefs] = useState(prefs);
  const mutation = useUpdateNotificationPreferences();

  const handleToggle = (key) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await mutation.mutateAsync(localPrefs);
      toast.success(content.preferencesSuccess.value);
    } catch {
      toast.error('Failed to update preferences');
    }
  };

  const hasChanges =
    localPrefs.email !== prefs.email ||
    localPrefs.push !== prefs.push ||
    localPrefs.mentions !== prefs.mentions ||
    localPrefs.messages !== prefs.messages ||
    localPrefs.communityUpdates !== prefs.communityUpdates;

  return (
    <div className="space-y-5">
      <h2 className="text-heading-5">{content.notificationPreferences.value}</h2>

      <div className="space-y-3">
        <Toggle
          checked={localPrefs.email}
          onChange={() => handleToggle('email')}
          label={content.emailNotifications.value}
          description={content.emailNotificationsDesc.value}
        />
        <Toggle
          checked={localPrefs.push}
          onChange={() => handleToggle('push')}
          label={content.pushNotifications.value}
          description={content.pushNotificationsDesc.value}
        />
        <Toggle
          checked={localPrefs.mentions}
          onChange={() => handleToggle('mentions')}
          label={content.mentionNotifications.value}
          description={content.mentionNotificationsDesc.value}
        />
        <Toggle
          checked={localPrefs.messages}
          onChange={() => handleToggle('messages')}
          label={content.messageNotifications.value}
          description={content.messageNotificationsDesc.value}
        />
        <Toggle
          checked={localPrefs.communityUpdates}
          onChange={() => handleToggle('communityUpdates')}
          label={content.communityNotifications.value}
          description={content.communityNotificationsDesc.value}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={mutation.isPending || !hasChanges}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {mutation.isPending && (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
          )}
          {content.savePreferences.value}
        </button>
      </div>
    </div>
  );
}
