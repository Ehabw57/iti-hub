import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@/store/auth';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import DeleteAccountSection from './DeleteAccountSection';

const TABS = [
  { id: 'profile', labelKey: 'profileTab' },
  { id: 'security', labelKey: 'securityTab' },
  { id: 'notifications', labelKey: 'notificationsTab' },
  { id: 'account', labelKey: 'accountTab' },
];

export default function SettingsController() {
  const content = useIntlayer('settings');
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-heading-3 mb-6">{content.pageTitle.value}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline mb-8 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const label = content[tab.labelKey]?.value || tab.id;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileSettings user={user} />}
      {activeTab === 'security' && <SecuritySettings />}
      {activeTab === 'notifications' && <NotificationSettings user={user} />}
      {activeTab === 'account' && <DeleteAccountSection />}
    </div>
  );
}
