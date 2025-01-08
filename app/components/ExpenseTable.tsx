'use client'

import { useState } from 'react';
import { formatAmount, getMonthName, formatTimestamp } from '@/lib/utils/formatters';
import { ExportButton } from './ExportButton';

interface ExpenseTableProps {
    expensesData: Record<string, any>[];
    summaryData: Record<string, any>[];
    loading: boolean;
    error: string | null;
}

type SortField = 'month' | 'category' | 'biller' | 'amount' | 'created_ts' | 'ef_month' | 'total' | 'currency';
type SortDirection = 'asc' | 'desc';

export function ExpenseTable({ expensesData, summaryData, loading, error }: ExpenseTableProps) {
    const [view, setView] = useState<'regular' | 'summary'>('regular');
    const [sortField, setSortField] = useState<SortField>('ef_month');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getMonthValue = (monthNum: number): number => {
        return monthNum;
    };

    const sortData = (data: Record<string, any>[]): Record<string, any>[] => {
        return [...data].sort((a, b) => {
            if (sortField === 'month' || sortField === 'ef_month') {
                const aValue = getMonthValue(a.month || a.ef_month);
                const bValue = getMonthValue(b.month || b.ef_month);
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            if (sortField === 'amount' || sortField === 'total') {
                const aValue = parseFloat(a.amount || a.total || 0);
                const bValue = parseFloat(b.amount || b.total || 0);
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            if (sortField === 'created_ts') {
                return sortDirection === 'asc' 
                    ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
                    : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
            }

            const aValue = a[sortField]?.toString().toLowerCase() ?? '';
            const bValue = b[sortField]?.toString().toLowerCase() ?? '';
            return sortDirection === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    };

    const sortedExpensesData = sortData(expensesData);
    const sortedSummaryData = sortData(summaryData);

    const getHighlightClass = (amount: number) => {
        // Find the maximum amount in the summary data
        const maxAmount = Math.max(...summaryData.map(item => parseFloat(item.total)));
        const intensity = (amount / maxAmount);
        
        if (intensity > 0.8) return 'bg-blue-100';
        if (intensity > 0.6) return 'bg-blue-50';
        if (intensity > 0.4) return 'bg-slate-50';
        if (intensity > 0.2) return 'bg-gray-50';
        return '';
    };

    if (loading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 py-4">{error}</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setView('regular')}
                        className={`px-4 py-2 rounded-lg ${
                            view === 'regular'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Regular View
                    </button>
                    <button
                        onClick={() => setView('summary')}
                        className={`px-4 py-2 rounded-lg ${
                            view === 'summary'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Summary View
                    </button>
                </div>
                <ExportButton 
                    data={view === 'regular' ? expensesData : summaryData}
                    activeView={view}
                    getMonthName={getMonthName}
                    formatTimestamp={formatTimestamp}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('ef_month')}
                            >
                                Month {sortField === 'ef_month' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            {view === 'regular' && (
                                <>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('category')}
                                    >
                                        Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('biller')}
                                    >
                                        Biller {sortField === 'biller' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                </>
                            )}
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort(view === 'regular' ? 'amount' : 'total')}
                            >
                                {view === 'regular' ? 'Amount' : 'Total'} {(sortField === 'amount' || sortField === 'total') && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            {view === 'regular' && (
                                <>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('currency')}
                                    >
                                        Currency {sortField === 'currency' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('created_ts')}
                                    >
                                        Created At {sortField === 'created_ts' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {view === 'regular'
                            ? sortedExpensesData.map((expense, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {getMonthName(expense.ef_month)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {expense.category}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {expense.biller}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          ₹{formatAmount(expense.amount)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                          {expense.currency}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {formatTimestamp(expense.created_ts)}
                                      </td>
                                  </tr>
                              ))
                            : sortedSummaryData.map((summary, index) => (
                                  <tr key={index} className={`${getHighlightClass(parseFloat(summary.total))} hover:bg-gray-100`}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {getMonthName(summary.month)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          ₹{formatAmount(summary.total)}
                                      </td>
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
