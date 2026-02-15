import React from 'react';
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string; // Applied to both th and td
    headerClassName?: string; // Specific to th
    cellClassName?: string; // Specific to td
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    emptyMessage?: React.ReactNode;
    searchBar?: React.ReactNode; // Kept for backward compat, but we might want to be more generic
    filters?: React.ReactNode;
    pagination?: React.ReactNode;
    className?: string;
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    emptyMessage = "Kayıt bulunamadı.",
    searchBar,
    filters,
    pagination,
    className
}: DataTableProps<T>) {
    return (
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
            {(searchBar || filters) && (
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    {searchBar && <div className="w-full sm:max-w-md">{searchBar}</div>}
                    {filters && <div className="w-full sm:w-auto">{filters}</div>}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className={cn("px-6 py-4 font-medium", col.className, col.headerClassName)}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data && data.length > 0 ? (
                            data.map((item) => (
                                <tr key={keyExtractor(item)} className="hover:bg-slate-50/50 transition-colors group">
                                    {columns.map((col, index) => (
                                        <td key={index} className={cn("px-6 py-3", col.className, col.cellClassName)}>
                                            {col.cell ? col.cell(item) : (col.accessorKey ? item[col.accessorKey] as React.ReactNode : null)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="p-4 border-t border-slate-100">
                    {pagination}
                </div>
            )}
        </div>
    );
}
