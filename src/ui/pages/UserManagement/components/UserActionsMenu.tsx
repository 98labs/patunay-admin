import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  MoreVertical, 
  Pencil, 
  ShieldCheck,
  Trash,
  Ban,
  CheckCircle
} from 'lucide-react';
import { classNames } from '../../../utils/classNames';

interface UserActionsMenuProps {
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  currentUserId?: string;
  onEdit: () => void;
  onManagePermissions: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  currentUserId,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onDelete,
}) => {
  // Don't allow users to modify themselves
  const isCurrentUser = user.id === currentUserId;
  
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="rounded-full flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
          <span className="sr-only">Open options</span>
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 focus:outline-none z-10">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={classNames(
                    active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                    'group flex items-center px-4 py-2 text-sm w-full'
                  )}
                >
                  <Pencil
                    className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                  Edit User
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onManagePermissions}
                  className={classNames(
                    active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                    'group flex items-center px-4 py-2 text-sm w-full'
                  )}
                >
                  <ShieldCheck
                    className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                  Manage Permissions
                </button>
              )}
            </Menu.Item>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onToggleStatus}
                  disabled={isCurrentUser}
                  className={classNames(
                    active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                    isCurrentUser ? 'opacity-50 cursor-not-allowed' : '',
                    'group flex items-center px-4 py-2 text-sm w-full'
                  )}
                >
                  {user.is_active ? (
                    <>
                      <Ban
                        className="mr-3 h-5 w-5 text-yellow-400 group-hover:text-yellow-500"
                        aria-hidden="true"
                      />
                      Disable User
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        className="mr-3 h-5 w-5 text-green-400 group-hover:text-green-500"
                        aria-hidden="true"
                      />
                      Enable User
                    </>
                  )}
                </button>
              )}
            </Menu.Item>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDelete}
                  disabled={isCurrentUser}
                  className={classNames(
                    active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                    isCurrentUser ? 'opacity-50 cursor-not-allowed' : '',
                    'group flex items-center px-4 py-2 text-sm w-full'
                  )}
                >
                  <Trash
                    className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"
                    aria-hidden="true"
                  />
                  Delete User
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};