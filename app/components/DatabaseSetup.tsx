'use client'

import { useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import { useState } from "react";

const CHECK_TABLE_QUERY = `
select case 
  when count(*) = 1 THEN 'TRUE'
  ELSE 'FALSE'
  end as table_status
from INFORMATION_SCHEMA.TABLES
where table_catalog='expensage_backend'
and table_name='expenses_forecast';`;

const CREATE_DATABASE_QUERY = `
create database if not exists expensage_backend;`;

const CREATE_TABLE_QUERY = `
create table if not exists expensage_backend.expenses_forecast
(
  ef_month int,
  category string,
  biller string,
  amount int,
  currency string,
  created_ts timestamp,
  updated_ts timestamp
);`;

interface DatabaseSetupProps {
    tokenInput: string;
}

export function DatabaseSetup({ tokenInput }: DatabaseSetupProps) {
    const { safeEvaluateQuery } = useMotherDuckClientState();
    const [isChecking, setIsChecking] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [objectsExist, setObjectsExist] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const checkDatabaseObjects = async () => {
        try {
            if (!tokenInput) {
                throw new Error('Please enter a MotherDuck token first');
            }

            console.log('Starting check...');
            setIsChecking(true);
            setError(null);
            
            const result = await safeEvaluateQuery(CHECK_TABLE_QUERY);
            console.log('Query result:', result);
            
            if (result.status === "success" && result.result.data) {
                const rows = result.result.data.toRows();
                console.log('Query rows:', rows);
                const status = rows[0]?.table_status;
                console.log('Table status:', status);
                setObjectsExist(status === 'TRUE');
            } else {
                console.error('Query failed:', result.err);
                throw new Error(result.err?.message || 'Failed to check database status');
            }
        } catch (err) {
            console.error('Error checking objects:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setObjectsExist(null);
        } finally {
            setIsChecking(false);
        }
    };

    const createDatabaseObjects = async () => {
        try {
            if (!tokenInput) {
                throw new Error('Please enter a MotherDuck token first');
            }

            console.log('Starting creation...');
            setIsCreating(true);
            setError(null);

            // First create database
            console.log('Creating database...');
            const dbResult = await safeEvaluateQuery(CREATE_DATABASE_QUERY);
            if (dbResult.status !== "success") {
                throw new Error(dbResult.err?.message || 'Failed to create database');
            }
            console.log('Database created successfully');

            // Then create table
            console.log('Creating table...');
            const tableResult = await safeEvaluateQuery(CREATE_TABLE_QUERY);
            if (tableResult.status !== "success") {
                throw new Error(tableResult.err?.message || 'Failed to create table');
            }
            console.log('Table created successfully');

            // Check objects after creation
            await checkDatabaseObjects();
        } catch (err) {
            console.error('Error creating objects:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => {
                            console.log('Check button clicked');
                            checkDatabaseObjects();
                        }}
                        disabled={isChecking || !tokenInput}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isChecking ? 'Checking...' : 'Check Objects'}
                    </button>

                    {objectsExist === false && (
                        <button
                            onClick={() => {
                                console.log('Create button clicked');
                                createDatabaseObjects();
                            }}
                            disabled={isCreating || !tokenInput}
                            className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Creating...' : 'Create Objects'}
                        </button>
                    )}
                </div>

                {objectsExist !== null && !error && (
                    <span className={`text-sm font-medium ${objectsExist ? 'text-green-600' : 'text-yellow-600'}`}>
                        {objectsExist ? '✓ Objects exist' : 'Objects not found'}
                    </span>
                )}
            </div>

            {error && (
                <div className="text-sm text-red-600">
                    Error: {error}
                </div>
            )}
        </div>
    );
}
