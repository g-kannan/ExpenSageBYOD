'use client'

import { exportToCsv } from "../../lib/csvExport";

interface ExportButtonProps {
    data: any[];
    activeView: 'regular' | 'summary';
    getMonthName: (month: number) => string;
    formatTimestamp?: (ts: string) => string;
}

export function ExportButton({ data, activeView, getMonthName, formatTimestamp }: ExportButtonProps) {
    const handleExportToCsv = () => {
        const headers = activeView === 'regular'
            ? ['Month', 'Category', 'Biller', 'Amount', 'Currency', 'Created At']
            : ['Month', 'Total Amount'];

        const formatRow = activeView === 'regular'
            ? (row: any) => [
                  getMonthName(row.ef_month),
                  row.category,
                  row.biller,
                  row.amount,
                  row.currency,
                  formatTimestamp ? formatTimestamp(row.created_ts) : row.created_ts
              ]
            : (row: any) => [
                  getMonthName(row.month),
                  row.total
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
        </button>
    );
}
