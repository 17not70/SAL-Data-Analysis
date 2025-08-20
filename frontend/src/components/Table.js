// -- RMK: Reusable Table components with corrected HTML structure. Version 1.0
// -- FILE: frontend/src/components/Table.js

import React from 'react';

// Custom Table components with corrected HTML structure
export const Table = ({ children }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
);

export const TableHeader = ({ children }) => (
  <thead className="sticky top-0 bg-white shadow-sm z-10">{children}</thead>
);

export const TableBody = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

export const TableRow = ({ children, ...props }) => (
  <tr className="border-b transition-colors hover:bg-gray-100" {...props}>{children}</tr>
);

export const TableHead = ({ children }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">{children}</th>
);

export const TableCell = ({ children }) => (
  <td className="p-4 align-middle">{children}</td>
);

export const TableCaption = ({ children }) => (
  <caption className="mt-4 text-sm text-gray-500">{children}</caption>
);
