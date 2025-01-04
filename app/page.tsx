"use client"

import { MotherDuckClientProvider, useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import { useCallback, useState, useEffect } from "react";
import { DatabaseSetup } from "./components/DatabaseSetup";

const SQL_QUERY_STRING = `
SELECT 
    ef_month,
    category,
    biller,
    amount,
    currency,
    created_ts
FROM expensage_backend.expenses_forecast
ORDER BY ef_month;`;

const SUMMARY_QUERY_STRING = `
SELECT ef_month as month, SUM(amount) as total 
FROM expensage_backend.expenses_forecast
GROUP BY ef_month
ORDER BY total DESC;`;

const STATS_QUERY_STRING = `
SELECT 
    sum(amount) as yearly_total,
    sum(amount)/12 as avg_expense_month,
    round(sum(amount)/365) as avg_expense_day 
FROM expensage_backend.expenses_forecast;`;

const INSERT_EXPENSE_QUERY = `
INSERT INTO expensage_backend.expenses_forecast (ef_month, category, biller, amount, currency, created_ts, updated_ts)
VALUES ($ef_month, '$category', '$biller', $amount, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;

interface ExpenseFormData {
    ef_month: number;
    category: string;
    biller: string;
    amount: number;
    recurring: boolean;
    frequency: 'Monthly' | 'Quarterly' | 'Fortnightly' | 'Half Yearly' | '';
}

const useFetchExpensesData = () => {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [error, setError] = useState<string | null>(null);

    const fetchExpensesData = useCallback(async () => {
        try {
            const result = await safeEvaluateQuery(SQL_QUERY_STRING);
            if (result.status !== "success") {
                throw new Error(result.err.message);
            }
            return result.result.data.toRows() || [];
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to fetch data: ${errorMessage}`);
            return [];
        }
    }, [safeEvaluateQuery]);

    const fetchSummaryData = useCallback(async () => {
        try {
            const result = await safeEvaluateQuery(SUMMARY_QUERY_STRING);
            if (result.status !== "success") {
                throw new Error(result.err.message);
            }
            return result.result.data.toRows() || [];
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to fetch summary data: ${errorMessage}`);
            return [];
        }
    }, [safeEvaluateQuery]);

    const fetchStatsData = useCallback(async () => {
        try {
            const result = await safeEvaluateQuery(STATS_QUERY_STRING);
            if (result.status !== "success") {
                throw new Error(result.err.message);
            }
            return result.result.data.toRows()?.[0] || null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to fetch stats data: ${errorMessage}`);
            return null;
        }
    }, [safeEvaluateQuery]);

    return { fetchExpensesData, fetchSummaryData, fetchStatsData, error };
}

const getMonthName = (monthNumber: number): string => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[(monthNumber - 1) % 12];
};

const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

function ExpenseInputForm({ onExpenseAdded }: { onExpenseAdded: () => void }) {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExpenseFormData>({
        ef_month: new Date().getMonth() + 1,
        category: '',
        biller: 'NA',
        amount: 0,
        recurring: false,
        frequency: ''
    });
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomCategory, setShowCustomCategory] = useState(false);

    const categories = [
        'Utilities',
        'Rent',
        'Insurance',
        'Groceries',
        'Entertainment',
        'Gas',
        'Internet',
        'Phone',
        'Other',
        'Custom'
    ];

    const frequencies = [
        'Monthly',
        'Quarterly',
        'Fortnightly',
        'Half Yearly'
    ];

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'Custom') {
            setShowCustomCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setShowCustomCategory(false);
            setFormData(prev => ({ ...prev, category: value }));
        }
    };

    const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomCategory(value);
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category) {
            setError('Please select or enter a category');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            
            if (formData.recurring && formData.frequency) {
                // Handle recurring expenses
                const startMonth = formData.ef_month;
                const queries: string[] = [];

                const generateMonths = (increment: number, count: number, divideAmount: number = 1) => {
                    for (let i = 0; i < count; i += increment) {
                        const month = ((startMonth - 1 + i) % 12) + 1;
                        const interpolatedQuery = INSERT_EXPENSE_QUERY
                            .replace('$ef_month', month.toString())
                            .replace('$category', formData.category.replace(/'/g, "''"))
                            .replace('$biller', formData.biller.replace(/'/g, "''"))
                            .replace('$amount', (formData.amount / divideAmount).toString());
                        queries.push(interpolatedQuery);
                    }
                };

                switch (formData.frequency) {
                    case 'Monthly':
                        generateMonths(1, 12);
                        break;
                    case 'Quarterly':
                        generateMonths(3, 12);
                        break;
                    case 'Fortnightly':
                        generateMonths(1, 12, 2); // Split amount in half
                        break;
                    case 'Half Yearly':
                        generateMonths(6, 12);
                        break;
                }

                // Execute all queries in sequence
                for (const query of queries) {
                    console.log('Executing recurring query:', query);
                    const result = await safeEvaluateQuery(query);
                    if (result.status !== "success") {
                        throw new Error('Failed to insert recurring expense');
                    }
                }
            } else {
                // Handle single expense
                const interpolatedQuery = INSERT_EXPENSE_QUERY
                    .replace('$ef_month', formData.ef_month.toString())
                    .replace('$category', formData.category.replace(/'/g, "''"))
                    .replace('$biller', formData.biller.replace(/'/g, "''"))
                    .replace('$amount', formData.amount.toString());

                console.log('Executing query:', interpolatedQuery);
                const result = await safeEvaluateQuery(interpolatedQuery);
                
                if (result.status !== "success") {
                    throw new Error('Failed to insert expense');
                }
            }

            setFormData({
                ef_month: new Date().getMonth() + 1,
                category: '',
                biller: 'NA',
                amount: 0,
                recurring: false,
                frequency: ''
            });
            setCustomCategory('');
            setShowCustomCategory(false);
            onExpenseAdded();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Error in handleSubmit:', errorMessage);
            setError(`Failed to add expense: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Month
                        </label>
                        <select
                            value={formData.ef_month}
                            onChange={(e) => setFormData(prev => ({ ...prev, ef_month: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        >
                            {[...Array(12).keys()].map(i => (
                                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={showCustomCategory ? 'Custom' : formData.category}
                            onChange={handleCategoryChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    {showCustomCategory && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Category
                            </label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={handleCustomCategoryChange}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                placeholder="Enter custom category"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Biller (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.biller}
                            onChange={(e) => setFormData(prev => ({ ...prev, biller: e.target.value || 'NA' }))}
                            placeholder="Enter biller name or leave as NA"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="Enter amount"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Recurring Expense
                        </label>
                        <input
                            type="checkbox"
                            checked={formData.recurring}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                            className="mr-2"
                        />
                    </div>

                    {formData.recurring && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Frequency
                            </label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as ExpenseFormData['frequency'] }))}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                <option value="">Select Frequency</option>
                                {frequencies.map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-red-500 text-sm mt-2">
                        {error}
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}

interface SortConfig {
    key: string;
    direction: 'ascending' | 'descending';
}

function ExpensesTable() {
    const { fetchExpensesData, fetchSummaryData, fetchStatsData, error: fetchError } = useFetchExpensesData();
    const { setToken } = useMotherDuckClientState();
    const [expensesData, setExpensesData] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total', direction: 'descending' });
    const [activeView, setActiveView] = useState<'table' | 'summary'>('table');

    const getAmountColor = (amount: number) => {
        const maxAmount = Math.max(...summaryData.map(item => item.total));
        const percentage = amount / maxAmount;
        
        if (percentage >= 0.8) return 'text-red-600'; // Hot
        if (percentage >= 0.6) return 'text-orange-500'; // Warm
        if (percentage >= 0.4) return 'text-yellow-500'; // Moderate
        if (percentage >= 0.2) return 'text-green-500'; // Cool
        return 'text-blue-500'; // Cold
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
            // For month sorting
            return direction === 'ascending' 
                ? a[key] - b[key]
                : b[key] - a[key];
        });
        setSummaryData(sortedData);
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    const handleFetchExpensesData = async () => {
        if (!tokenInput) {
            setError('Please enter a MotherDuck token');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setToken(tokenInput);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Fetch all data
            const [regularData, summaryData, statsData] = await Promise.all([
                fetchExpensesData(),
                fetchSummaryData(),
                fetchStatsData()
            ]);

            console.log('Regular Data:', regularData);
            console.log('Summary Data:', summaryData);
            console.log('Stats Data:', statsData);

            setExpensesData(regularData || []);
            setSummaryData(summaryData || []);
            setStatsData(statsData);

            if ((!regularData || regularData.length === 0) && (!summaryData || summaryData.length === 0)) {
                setError('No data returned from the query. Please check if the table exists and has data.');
            } else {
                setError(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('Error in handleFetchExpensesData:', errorMessage);
            setError(`Failed to fetch data: ${errorMessage}`);
            setExpensesData([]);
            setSummaryData([]);
            setStatsData(null);
        } finally {
            setLoading(false);
        }
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
        setExpensesData(sortedData);
    };

    const displayError = error || fetchError;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-center mb-8">
                <img 
                    src="/ExpenSage_logo.png" 
                    alt="ExpenSage Logo" 
                    className="h-24 w-auto"
                />
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4 text-sm text-gray-600">
                    <p>Don't have a MotherDuck account? <a href="https://app.motherduck.com/?auth_flow=signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Sign up here</a> to get your token.</p>
                </div>
                <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">MotherDuck Token</label>
                <input
                    type="password"
                    id="token"
                    value={tokenInput}
                    onChange={(e) => {
                        setTokenInput(e.target.value);
                        setToken(e.target.value);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    placeholder="Enter your MotherDuck token"
                />
            </div>

            <DatabaseSetup tokenInput={tokenInput} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Yearly Total</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        ₹{statsData?.yearly_total?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Expense/Month</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        ₹{statsData?.avg_expense_month?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Expense/Day</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        ₹{statsData?.avg_expense_day?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                </div>
            </div>

            <ExpenseInputForm onExpenseAdded={handleFetchExpensesData} />
            
            <div className="flex justify-end">
                <button 
                    onClick={handleFetchExpensesData} 
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh Data'}
                </button>
            </div>

            {displayError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    {displayError}
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
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
                    </nav>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : displayError ? (
                    <div className="text-red-500 text-center py-4">{displayError}</div>
                ) : activeView === 'summary' ? (
                    <div className="overflow-x-auto">
                        <div className="max-h-[600px] overflow-y-auto">
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
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="max-h-[600px] overflow-y-auto">
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
                                        <tr key={index} 
                                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150`}>
                                            <td className="px-6 py-4 text-gray-900">
                                                {getMonthName(item.ef_month)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {item.category}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {item.biller}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900 font-medium">
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50">
            <MotherDuckClientProvider database="my_db">
                <ExpensesTable />
            </MotherDuckClientProvider>
        </main>
    );
}
