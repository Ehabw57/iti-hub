import { Menu } from "@headlessui/react";

export default function UserMenu({ user, logout }) {
  return (
    <Menu as="div" className="relative">
      {/* الصورة */}
      <Menu.Button className="flex items-center gap-2 focus:outline-none">
        <img
          src={user?.avatar || "/avatar.png"}
          alt="avatar"
          className="w-9 h-9 rounded-full object-cover border cursor-pointer"
        />
      </Menu.Button>

      {/* Dropdown Menu */}
      <Menu.Items className="absolute right-0 mt-2 w-36 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 z-50">
        {/* عنوان اليوزر */}
        <div className="px-4 py-2 border-b dark:border-neutral-700">
          <p className="text-sm font-semibold">{user?.username}</p>
          <p className="text-xs text-neutral-500">{user?.email}</p>
        </div>

        {/* الخيارات */}
        <Menu.Item>
          {({ active }) => (
            <button
              className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-neutral-100 dark:bg-neutral-700' : ''}`}
            >
              Profile
            </button>
          )}
        </Menu.Item>

        <Menu.Item>
          {({ active }) => (
            <button
              onClick={logout}
              className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-neutral-100 dark:bg-neutral-700' : ''}`}
            >
              Logout
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
