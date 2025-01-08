'use client'

import { useState } from 'react';
import { getMonthName, formatAmount, formatTimestamp } from '@/lib/utils/formatters';
import { ExportButton } from './ExportButton';

interface SortConfig {
    key: string;
    direction: 'ascending' | 'descending';
}

interface ExpenseTableProps {
    expensesData: any[];
    summaryData: any[];
    loading: boolean;
    error: string | null;
}

export function ExpenseTable({ expensesData, summaryData, loading, error }: ExpenseTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total', direction: 'descending' });
    const [activeView, setActiveView] = useState<'table' | 'summary'>('table');

    const getAmountColor = (amount: number) => {
        const maxAmount = Math.max(...summaryData.map(item => item.total));
        const percentage = amount / maxAmount;
        
        if (percentage >= 0.8) return 'text-red-600';
        if (percentage >= 0.6) return 'text-orange-500';
        if (percentage >= 0.4) return 'text-yellow-500';
        if (percentage >= 0.2) return 'text-green-500';
        return 'text-blue-500';
    };

    const sortData = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedData = [...expensesData].sort((a, b) => {
            if (key === 'amount') {
                return direction === 'ascending' ? a[key] - b[key] : b[key] - a[key];
            }
            if (key === 'created_ts') {
                return direction === 'ascending' 
                    ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
                    : new Date(b[key]).getTime() - new Date(a[key]).getTime();
            }
            if (direction === 'ascending') {
                return a[key] > b[key] ? 1 : -1;
            }
            return a[key] < b[key] ? 1 : -1;
        });
        return sortedData;
    };

    const sortSummaryData = (key: 'month' | 'total') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedData = [...summaryData].sort((a, b) => {
            if (key === 'total') {
                return direction === 'ascending' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'ascending' 
                ? a[key] - b[key]
                : b[key] - a[key];
        });
        return sortedData;
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    if (loading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
                <nav className="flex justify-between items-center">
                    <div className="flex">
                        <button
                            onClick={() => setActiveView('table')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeView === 'table'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Table View
                        </button>
                        <button
                            onClick={() => setActiveView('summary')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeView === 'summary'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Monthly Summary
                        </button>
                    </div>
                    <ExportButton 
                        data={activeView === 'table' ? expensesData : summaryData}
                        activeView={activeView}
                        getMonthName={getMonthName}
                        formatTimestamp={formatTimestamp}
                    />
                </nav>
            </div>

            <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                    {activeView === 'summary' ? (
                        <table className="min-w-full bg-white">
                            <thead className="sticky top-0 bg-blue-600 text-white">
                                <tr>
                                    <th 
                                        onClick={() => sortSummaryData('month')}
                                        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors duration-150"
                                    >
                                        Month {getSortIcon('month')}
                                    </th>
                                    <th 
                                        onClick={() => sortSummaryData('total')}
                                        className="px-6 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors duration-150"
                                    >
                                        Total Amount {getSortIcon('total')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {summaryData.map((item, index) => (
                                    <tr key={index} 
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150`}>
                                        <td className="px-6 py-4 text-gray-900">
                                            {getMonthName(item.month)}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${getAmountColor(item.total)}`}>
                                            {formatAmount(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="min-w-full bg-white">
                            <thead className="sticky top-0 bg-blue-600 text-white">
                                <tr>
                                    <th onClick={() => sortData('ef_month')} 
                                        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Month {getSortIcon('ef_month')}
                                    </th>
                                    <th onClick={() => sortData('category')}
                                        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Category {getSortIcon('category')}
                                    </th>
                                    <th onClick={() => sortData('biller')}
                                        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Biller {getSortIcon('biller')}
                                    </th>
                                    <th onClick={() => sortData('amount')}
                                        className="px-6 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Amount {getSortIcon('amount')}
                                    </th>
                                    <th onClick={() => sortData('currency')}
                                        className="px-6 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Currency {getSortIcon('currency')}
                                    </th>
                                    <th onClick={() => sortData('created_ts')}
                                        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 border-b border-blue-500">
                                        Created At {getSortIcon('created_ts')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expensesData.map((item, index) => (
                                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150`}>
                                        <td className="px-6 py-4 text-gray-900">
                                            {getMonthName(item.ef_month)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {item.biller}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-blue-600">
                                            {formatAmount(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-900">
                                            {item.currency}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {formatTimestamp(item.created_ts)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
