"use client"

import { MotherDuckClientProvider, useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import HintComponent from "./components/hint";
import { useCallback, useState, useEffect } from "react";

const SQL_QUERY_STRING = `
SELECT 
    ef_month,
    category,
    biller 
FROM expensage_backend.expenses_forecast
ORDER BY ef_month;`;

const INSERT_EXPENSE_QUERY = `
INSERT INTO expensage_backend.expenses_forecast (ef_month, category, biller, amount, currency, created_ts, updated_ts)
VALUES (?, ?, ?, ?, 'INR', current_timestamp, current_timestamp);`;

interface ExpenseFormData {
    ef_month: string;
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

function ExpenseInputForm({ onExpenseAdded }: { onExpenseAdded: () => void }) {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExpenseFormData>({
        ef_month: new Date().toISOString().slice(0, 7),
        category: '',
        biller: '',
        amount: 0
    });

    const categories = [
        'Food',
        'Transportation',
        'Housing',
        'Utilities',
        'Healthcare',
        'Entertainment',
        'Shopping',
        'Education',
        'Insurance',
        'Other'
    ];

    const validateForm = (): boolean => {
        if (!formData.ef_month) {
            setError('Month is required');
            return false;
        }
        if (!formData.category) {
            setError('Category is required');
            return false;
        }
        if (!formData.biller) {
            setError('Biller is required');
            return false;
        }
        if (!formData.amount || formData.amount <= 0) {
            setError('Amount must be greater than 0');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            // Create an array of values in the correct order
            const values = [
                formData.ef_month,
                formData.category,
                formData.biller,
                formData.amount
            ];

            // Replace only the first 4 placeholders with form values
            let queryParts = INSERT_EXPENSE_QUERY.split('?');
            let finalQuery = queryParts[0];
            
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (value === undefined || value === null) {
                    throw new Error('Required field is missing');
                }
                finalQuery += (typeof value === 'number' ? value : `'${value}'`) + queryParts[i + 1];
            }

            console.log('Executing query:', finalQuery);
            const result = await safeEvaluateQuery(finalQuery);
            
            if (result.status === "success") {
                setFormData({
                    ef_month: new Date().toISOString().slice(0, 7),
                    category: '',
                    biller: '',
                    amount: 0
                });
                onExpenseAdded();
            } else {
                setError(result.err.message);
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err instanceof Error ? err.message : 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-xl font-bold text-white">Add New Expense</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                        <input
                            type="month"
                            name="ef_month"
                            value={formData.ef_month}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Biller</label>
                        <input
                            type="text"
                            name="biller"
                            value={formData.biller}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                            required
                        />
                    </div>
                </div>
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ExpensesTable() {
    const { fetchExpensesData, error: fetchError } = useFetchExpensesData();
    const { setToken } = useMotherDuckClientState();
    const [expensesData, setExpensesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [error, setError] = useState<string | null>(null);

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

    const displayError = error || fetchError;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
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
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {Object.keys(expensesData[0]).map((key) => (
                                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expensesData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition duration-150">
                                        {Object.values(item).map((value: any, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {typeof value?.valueOf() === 'number' 
                                                    ? value.valueOf().toFixed(2) 
                                                    : value?.valueOf()?.toString()}
                                            </td>
                                        ))}
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
