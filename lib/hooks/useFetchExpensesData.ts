import { useCallback, useState } from 'react';
import { useMotherDuckClientState } from '@/lib/motherduck/context/motherduckClientContext';
import { SQL_QUERY_STRING, SUMMARY_QUERY_STRING, STATS_QUERY_STRING } from '../constants/queries';

export const useFetchExpensesData = () => {
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

    const fetchSummaryData = useCallback(async (currency: string = 'INR') => {
        try {
            const query = SUMMARY_QUERY_STRING.replace('$currency', currency);
            const result = await safeEvaluateQuery(query);
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
};
