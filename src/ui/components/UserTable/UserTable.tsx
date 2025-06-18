import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';

import { User, UserRole, USER_ROLES } from '../../typings';
import { Loading, UserAvatar } from '@components';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onDeactivateUser: (user: User) => void;
  onActivateUser: (user: User) => void;
  onViewUser: (user: User) => void;
  className?: string;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onEditUser,
  onDeleteUser,
  onDeactivateUser,
  onActivateUser,
  onViewUser,
  className = '',
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'badge-primary';
      case 'staff':
        return 'badge-secondary';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive ? 'badge-success' : 'badge-error';
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      header: 'User',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <UserAvatar
            avatarUrl={row.original.avatar_url}
            firstName={row.original.first_name}
            lastName={row.original.last_name}
            email={row.original.email}
            size="md"
          />
          <div>
            <div className="font-medium text-base-content">
              {row.original.first_name && row.original.last_name 
                ? `${row.original.first_name} ${row.original.last_name}`
                : 'No name'
              }
            </div>
            <div className="text-sm text-base-content/60">{row.original.email}</div>
            {row.original.phone && (
              <div className="text-xs text-base-content/50">{row.original.phone}</div>
            )}
          </div>
        </div>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.first_name || ''} ${rowA.original.last_name || ''}`.trim() || rowA.original.email;
        const nameB = `${rowB.original.first_name || ''} ${rowB.original.last_name || ''}`.trim() || rowB.original.email;
        return nameA.localeCompare(nameB);
      },
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => {
        const role = getValue() as UserRole;
        return (
          <span className={`badge ${getRoleBadgeClass(role)} badge-sm`}>
            {USER_ROLES[role]?.label || role}
          </span>
        );
      },
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === 'all') return true;
        return row.original.role === filterValue;
      },
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ getValue, row }) => {
        const isActive = getValue() as boolean;
        const hasConfirmedEmail = !!row.original.email_confirmed_at;
        
        return (
          <div className="flex flex-col gap-1">
            <span className={`badge ${getStatusBadgeClass(isActive)} badge-sm`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            {!hasConfirmedEmail && (
              <span className="badge badge-warning badge-xs">
                Email not confirmed
              </span>
            )}
          </div>
        );
      },
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === 'all') return true;
        if (filterValue === 'active') return row.original.is_active;
        if (filterValue === 'inactive') return !row.original.is_active;
        return true;
      },
    },
    {
      header: 'Last Login',
      accessorKey: 'last_login_at',
      cell: ({ getValue }) => {
        const lastLogin = getValue() as string;
        if (!lastLogin) {
          return <span className="text-base-content/60 text-sm">Never</span>;
        }
        
        const loginDate = new Date(lastLogin);
        return (
          <div className="text-sm">
            <div className="text-base-content">
              {formatDistanceToNow(loginDate, { addSuffix: true })}
            </div>
            <div className="text-xs text-base-content/60">
              {format(loginDate, 'MMM dd, yyyy HH:mm')}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ getValue }) => {
        const createdAt = getValue() as string;
        if (!createdAt) return <span className="text-base-content/60">—</span>;
        
        const date = new Date(createdAt);
        return (
          <div className="text-sm">
            <div className="text-base-content">
              {format(date, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-base-content/60">
              {format(date, 'HH:mm')}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewUser(row.original)}
            className="btn btn-ghost btn-xs"
            title="View user details"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button
            onClick={() => onEditUser(row.original)}
            className="btn btn-ghost btn-xs"
            title="Edit user"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {row.original.is_active ? (
            <button
              onClick={() => onDeactivateUser(row.original)}
              className="btn btn-ghost btn-xs text-warning hover:text-warning"
              title="Deactivate user"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onActivateUser(row.original)}
              className="btn btn-ghost btn-xs text-success hover:text-success"
              title="Activate user"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
        </div>
      ),
      enableSorting: false,
    },
  ], [onEditUser, onDeleteUser, onDeactivateUser, onActivateUser, onViewUser]);

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const { first_name, last_name, email } = row.original;
      const fullName = `${first_name ?? ''} ${last_name ?? ''}`.toLowerCase();
      return (
        fullName.includes(filterValue.toLowerCase()) ||
        (email ?? '').toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Global Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input input-bordered w-full bg-base-100 text-base-content"
            aria-label="Search users"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:w-48">
          <select
            value={columnFilters.find((f) => f.id === 'role')?.value || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setColumnFilters((prev) => {
                const filtered = prev.filter((f) => f.id !== 'role');
                if (value !== 'all') {
                  filtered.push({ id: 'role', value });
                }
                return filtered;
              });
            }}
            className="select select-bordered w-full bg-base-100 text-base-content"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={columnFilters.find((f) => f.id === 'is_active')?.value || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setColumnFilters((prev) => {
                const filtered = prev.filter((f) => f.id !== 'is_active');
                if (value !== 'all') {
                  filtered.push({ id: 'is_active', value });
                }
                return filtered;
              });
            }}
            className="select select-bordered w-full bg-base-100 text-base-content"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
        <table className="table table-sm w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-base-200 text-base-content">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:bg-base-300'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-xs text-base-content/70">
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-base-200/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="text-base-content">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 bg-base-100">
            <div className="text-base-content/60">
              {globalFilter || columnFilters.length > 0
                ? 'No users match your filters'
                : 'No users found'}
            </div>
            {(globalFilter || columnFilters.length > 0) && (
              <button
                className="btn btn-sm btn-ghost mt-2"
                onClick={() => {
                  setGlobalFilter('');
                  setColumnFilters([]);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Page info */}
          <div className="text-sm text-base-content/70">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-sm btn-ghost"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-sm btn-ghost"
            >
              {'<'}
            </button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-base-content">Page</span>
              <input
                type="number"
                value={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="input input-sm input-bordered w-16 text-center bg-base-100 text-base-content"
                min={1}
                max={table.getPageCount()}
              />
              <span className="text-sm text-base-content">of {table.getPageCount()}</span>
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn btn-sm btn-ghost"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="btn btn-sm btn-ghost"
            >
              {'>>'}
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content">Show</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="select select-sm select-bordered bg-base-100 text-base-content"
              aria-label="Number of rows per page"
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;