"use client"

import { MotherDuckClientProvider, useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import { useState } from "react";
import { DatabaseSetup } from "./components/DatabaseSetup";
import { ExpenseInputForm } from "./components/ExpenseInputForm";
import { ExpenseTable } from "./components/ExpenseTable";
import { StatsPanel } from "./components/StatsPanel";
import { useFetchExpensesData } from "@/lib/hooks/useFetchExpensesData";

function ExpensageApp() {
    const [tokenInput, setTokenInput] = useState('');
    const [expensesData, setExpensesData] = useState<Record<string, any>[]>([]);
    const [summaryData, setSummaryData] = useState<Record<string, any>[]>([]);
    const [statsData, setStatsData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setToken } = useMotherDuckClientState();
    const { fetchExpensesData, fetchSummaryData, fetchStatsData, error: fetchError } = useFetchExpensesData();

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
            
            const [regularData, summaryData, statsData] = await Promise.all([
                fetchExpensesData(),
                fetchSummaryData(),
                fetchStatsData()
            ]);

            setExpensesData(regularData ? [...regularData] : []);
            setSummaryData(summaryData ? [...summaryData] : []);
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                <div className="flex justify-center mb-8 bg-white rounded-xl shadow-sm p-4">
                    <img 
                        src="/ExpenSage_logo.png" 
                        alt="ExpenSage Logo" 
                        className="h-24 w-auto"
                    />
                </div>
                
                {/* Token Input Section */}
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
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white"
                        placeholder="Enter your MotherDuck token"
                    />
                </div>

                {/* Database Setup Component */}
                <DatabaseSetup tokenInput={tokenInput} />
                
                {/* Stats Panel Component */}
                <StatsPanel statsData={statsData} />

                {/* Expense Input Form Component */}
                <ExpenseInputForm onExpenseAdded={handleFetchExpensesData} />
                
                {/* Refresh Data Button */}
                <div className="flex justify-end bg-white rounded-xl shadow-lg p-4">
                    <button 
                        onClick={handleFetchExpensesData} 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Main Expense Table Component */}
                <ExpenseTable 
                    expensesData={expensesData}
                    summaryData={summaryData}
                    loading={loading}
                    error={error || fetchError}
                />
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <MotherDuckClientProvider>
            <ExpensageApp />
        </MotherDuckClientProvider>
    );
}
