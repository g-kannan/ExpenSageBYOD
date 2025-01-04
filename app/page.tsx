"use client"

import { MotherDuckClientProvider, useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import HintComponent from "./components/hint";
import { useCallback, useState, useEffect } from "react";

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

const INSERT_EXPENSE_QUERY = `
INSERT INTO expensage_backend.expenses_forecast (ef_month, category, biller, amount, currency, created_ts, updated_ts)
VALUES ($ef_month, '$category', '$biller', $amount, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;

interface ExpenseFormData {
    ef_month: number;
    category: string;
    biller: string;
    amount: number;
}

const useFetchExpensesData = () => {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [error, setError] = useState<string | null>(null);

    const fetchExpensesData = useCallback(async () => {
        try {
            console.log('Executing query:', SQL_QUERY_STRING);
            const safeResult = await safeEvaluateQuery(SQL_QUERY_STRING);
            console.log('Query result:', safeResult);
            
            if (safeResult.status === "success") {
                setError(null);
                const rows = safeResult.result.data.toRows();
                console.log('Parsed rows:', rows);
                return rows;
            } else {
                const errorMsg = `Query failed: ${safeResult.err.message}`;
                console.error(errorMsg);
                setError(errorMsg);
                return [];
            }
        } catch (error) {
            const errorMsg = "fetchExpensesData failed with error: " + (error instanceof Error ? error.message : String(error));
            console.error(errorMsg);
            setError(errorMsg);
            return [];
        }
    }, [safeEvaluateQuery]);

    return { fetchExpensesData, error };
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
        biller: '',
        amount: 0
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
            
            // Create and execute the query with interpolated values
            const interpolatedQuery = INSERT_EXPENSE_QUERY
                .replace('$ef_month', formData.ef_month.toString())
                .replace('$category', formData.category.replace(/'/g, "''"))  // Escape single quotes
                .replace('$biller', formData.biller.replace(/'/g, "''"))      // Escape single quotes
                .replace('$amount', formData.amount.toString());

            console.log('Executing query:', interpolatedQuery);
            const result = await safeEvaluateQuery(interpolatedQuery);

            if (result.status === "success") {
                setFormData({
                    ef_month: new Date().getMonth() + 1,
                    category: '',
                    biller: '',
                    amount: 0
                });
                setCustomCategory('');
                setShowCustomCategory(false);
                onExpenseAdded();
            } else {
                throw new Error(result.err.message);
            }
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Biller
                        </label>
                        <input
                            type="text"
                            value={formData.biller}
                            onChange={(e) => setFormData(prev => ({ ...prev, biller: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="Enter biller name"
                            required
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
                </div>

                {error && (
                    <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    const { fetchExpensesData, error: fetchError } = useFetchExpensesData();
    const { setToken } = useMotherDuckClientState();
    const [expensesData, setExpensesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'ef_month', direction: 'ascending' });

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
            const result = await fetchExpensesData();
            if (!result) {
                throw new Error('No result returned from query');
            }
            if (Array.isArray(result) && result.length === 0) {
                setError('No data returned from the query. Please check if the table exists and has data.');
            } else {
                setExpensesData(result);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('Error in handleFetchExpensesData:', errorMessage);
            setError(`Failed to fetch data: ${errorMessage}`);
            setExpensesData([]);
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

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
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
                <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">MotherDuck Token</label>
                <input
                    type="password"
                    id="token"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    placeholder="Enter your MotherDuck token"
                />
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
                {expensesData.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-blue-600 text-white">
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
                )}
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50">
            <MotherDuckClientProvider database="expensage_backend">
                <ExpensesTable />
                <HintComponent />
            </MotherDuckClientProvider>
        </main>
    );
}
