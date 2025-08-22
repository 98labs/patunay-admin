import React from 'react';
import '../../styles/shimmer.css';

export interface SkeletonColumnConfig {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cellRenderer?: () => React.ReactNode;
}

interface TableSkeletonProps {
  columns: SkeletonColumnConfig[];
  rows?: number;
  showPagination?: boolean;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 10,
  showPagination = true,
  className = '',
  headerClassName = '',
  cellClassName = '',
}) => {
  const skeletonRows = Array.from({ length: rows });

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getJustifyClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  const defaultCellRenderer = (width: string = 'w-24') => (
    <div className={`h-4 skeleton-shimmer rounded ${width}`} />
  );

  return (
    <div
      className={`overflow-hidden rounded-lg ${className}`}
      style={{
        borderColor: 'var(--color-neutral-gray-01)',
        backgroundColor: 'var(--color-neutral-white)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderColor: 'var(--color-neutral-gray-01)' }}>
          <thead style={{ backgroundColor: 'var(--color-neutral-gray-01)' }}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-xs font-semibold tracking-wider uppercase ${getAlignmentClass(
                    column.align
                  )} ${headerClassName}`}
                  style={{ color: 'var(--color-neutral-black-02)' }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--color-neutral-white)' }}>
            {skeletonRows.map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  rowIndex % 2 === 0
                    ? 'bg-[var(--color-neutral-white)]'
                    : 'bg-[var(--color-neutral-gray-01)]/20'
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-2 whitespace-nowrap ${cellClassName}`}
                  >
                    <div className={`flex ${getJustifyClass(column.align)}`}>
                      {column.cellRenderer
                        ? column.cellRenderer()
                        : defaultCellRenderer(column.width)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div
          className="flex items-center justify-between px-6 py-3 border-t"
          style={{ borderColor: 'var(--color-neutral-gray-01)' }}
        >
          <div className="flex items-center space-x-2">
            <div className="h-4 skeleton-shimmer rounded w-24" />
            <div className="h-8 skeleton-shimmer rounded w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 skeleton-shimmer rounded w-20" />
            <div className="h-4 skeleton-shimmer rounded w-32" />
            <div className="h-8 skeleton-shimmer rounded w-20" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSkeleton;