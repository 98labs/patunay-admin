import React from 'react';
import { classNames } from '../../utils/classNames';

interface Column {
  header: string;
  accessor: string;
  cell?: (row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

const Table: React.FC<TableProps> = ({ columns, data, className = '' }) => {
  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((column) => (
                <td
                  key={column.accessor}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {column.cell ? column.cell(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;