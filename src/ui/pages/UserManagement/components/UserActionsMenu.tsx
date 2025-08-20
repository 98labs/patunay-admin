import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical, Pencil, ShieldCheck, Trash, Ban, CheckCircle } from 'lucide-react';
import { classNames } from '../../../utils/classNames';

interface UserActionsMenuProps {
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  currentUserId?: string;
  currentUserRole?: string;
  onEdit: () => void;
  onManagePermissions: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  currentUserId,
  currentUserRole,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onDelete,
}) => {
  // Don't allow users to modify themselves
  const isCurrentUser = user.id === currentUserId;
  // Only super_user can delete users
  const canDelete = currentUserRole === 'super_user' && !isCurrentUser;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center cursor-pointer rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-none dark:hover:text-gray-300 dark:focus:ring-offset-gray-800 transition-colors">
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
        <Menu.Items className="ring-opacity-5 absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none dark:divide-gray-700 dark:bg-gray-800">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={classNames(
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center px-4 py-2 text-sm'
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
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center px-4 py-2 text-sm'
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
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                    isCurrentUser ? 'cursor-not-allowed opacity-50' : '',
                    'group flex w-full items-center px-4 py-2 text-sm'
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

          {!isCurrentUser && (
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={canDelete ? onDelete : undefined}
                    disabled={!canDelete}
                    title={!canDelete ? 'Contact Patunay support to delete a user' : ''}
                    className={classNames(
                      active && canDelete
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300',
                      !canDelete ? 'cursor-not-allowed opacity-50' : '',
                      'group flex w-full items-center px-4 py-2 text-sm'
                    )}
                  >
                    <Trash
                      className={classNames(
                        'mr-3 h-5 w-5',
                        canDelete ? 'text-red-400 group-hover:text-red-500' : 'text-gray-400'
                      )}
                      aria-hidden="true"
                    />
                    Delete User
                  </button>
                )}
              </Menu.Item>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
