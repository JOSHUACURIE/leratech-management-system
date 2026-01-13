// src/components/common/Table.tsx
import React from "react";

type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <table className="min-w-full border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="py-2 px-4 text-left border-b">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {columns.map((col, j) => (
              <td key={j} className="py-2 px-4 border-b">
                {typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
