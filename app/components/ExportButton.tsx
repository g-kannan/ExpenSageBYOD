'use client'

import { exportToCsv } from "../../lib/csvExport";

interface ExportButtonProps {
    data: any[];
    activeView: 'table' | 'summary';
    getMonthName: (month: number) => string;
    formatTimestamp?: (ts: string) => string;
}

export function ExportButton({ data, activeView, getMonthName, formatTimestamp }: ExportButtonProps) {
    const handleExportToCsv = () => {
        const headers = activeView === 'table'
            ? ['Month', 'Category', 'Biller', 'Amount', 'Currency', 'Created At']
            : ['Month', 'Total Amount'];

        const formatRow = activeView === 'table'
            ? (row: any) => [
                  getMonthName(row.ef_month),
                  `"${row.category}"`,
                  `"${row.biller}"`,
                  row.amount.toString(),
                  row.currency,
                  formatTimestamp ? formatTimestamp(row.created_ts) : row.created_ts
              ]
            : (row: any) => [
                  getMonthName(row.month),
                  row.total.toString()
              ];

        exportToCsv(`expensage_${activeView}_${new Date().toISOString().split('T')[0]}.csv`, headers, data, formatRow);
    };

    return (
        <button
            onClick={handleExportToCsv}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Export to CSV"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
        </button>
    );
}
