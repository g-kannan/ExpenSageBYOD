'use client'

import { useState } from 'react';
import { useMotherDuckClientState } from '@/lib/motherduck/context/motherduckClientContext';
import { INSERT_EXPENSE_QUERY } from '@/lib/constants/queries';

interface ExpenseFormData {
    ef_month: number;
    category: string;
    customCategory: string;
    biller: string;
    amount: number;
    recurring: boolean;
    frequency: 'Monthly' | 'Quarterly' | 'Fortnightly' | 'Half Yearly' | '';
}

interface ExpenseInputFormProps {
    onExpenseAdded: () => void;
}

const CATEGORIES = [
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

export function ExpenseInputForm({ onExpenseAdded }: ExpenseInputFormProps) {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [formData, setFormData] = useState<ExpenseFormData>({
        ef_month: new Date().getMonth() + 1,
        category: '',
        customCategory: '',
        biller: '',
        amount: 0,
        recurring: false,
        frequency: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
            
            if (!finalCategory || !formData.biller || formData.amount <= 0) {
                throw new Error('Please fill in all required fields with valid values');
            }

            const months = formData.recurring ? getRecurringMonths(formData.frequency) : [formData.ef_month];
            
            for (const month of months) {
                const query = INSERT_EXPENSE_QUERY
                    .replace('$ef_month', month.toString())
                    .replace('$category', finalCategory)
                    .replace('$biller', formData.biller)
                    .replace('$amount', formData.amount.toString());

                const result = await safeEvaluateQuery(query);
                if (result.status !== "success") {
                    throw new Error(result.err?.message || 'Failed to insert expense');
                }
            }

            // Reset form
            setFormData({
                ef_month: new Date().getMonth() + 1,
                category: '',
                customCategory: '',
                biller: '',
                amount: 0,
                recurring: false,
                frequency: ''
            });

            onExpenseAdded();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRecurringMonths = (frequency: string): number[] => {
        const currentMonth = formData.ef_month;
        const months: number[] = [];
        
        switch (frequency) {
            case 'Monthly':
                for (let i = 0; i < 12; i++) {
                    months.push(((currentMonth - 1 + i) % 12) + 1);
                }
                break;
            case 'Quarterly':
                for (let i = 0; i < 12; i += 3) {
                    months.push(((currentMonth - 1 + i) % 12) + 1);
                }
                break;
            case 'Fortnightly':
                // Assuming fortnightly means every two months
                for (let i = 0; i < 12; i += 2) {
                    months.push(((currentMonth - 1 + i) % 12) + 1);
                }
                break;
            case 'Half Yearly':
                for (let i = 0; i < 12; i += 6) {
                    months.push(((currentMonth - 1 + i) % 12) + 1);
                }
                break;
            default:
                months.push(currentMonth);
        }
        
        return months;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ef_month" className="block text-sm font-medium text-gray-700 mb-1">
                            Month
                        </label>
                        <select
                            id="ef_month"
                            value={formData.ef_month}
                            onChange={(e) => setFormData({ ...formData, ef_month: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <div className="space-y-2">
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                <option value="">Select a category</option>
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            
                            {formData.category === 'Custom' && (
                                <input
                                    type="text"
                                    id="customCategory"
                                    value={formData.customCategory}
                                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                    placeholder="Enter custom category"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="biller" className="block text-sm font-medium text-gray-700 mb-1">
                            Biller
                        </label>
                        <input
                            type="text"
                            id="biller"
                            value={formData.biller}
                            onChange={(e) => setFormData({ ...formData, biller: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., Electric Company"
                        />
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            id="amount"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={formData.recurring}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                recurring: e.target.checked,
                                frequency: e.target.checked ? formData.frequency || 'Monthly' : ''
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
                            Recurring Expense
                        </label>
                    </div>

                    {formData.recurring && (
                        <div>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Fortnightly">Fortnightly</option>
                                <option value="Half Yearly">Half Yearly</option>
                            </select>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}
