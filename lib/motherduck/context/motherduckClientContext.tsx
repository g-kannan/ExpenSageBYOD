"use client"

import { fetchMotherDuckToken } from "../functions/fetchMotherDuckToken";
import initMotherDuckConnection from "../functions/initMotherDuckConnection";
import type { MaterializedQueryResult, MDConnection, SafeQueryResult } from "@motherduck/wasm-client";
import 'core-js/actual/promise/with-resolvers';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// Safe interface for using the connection
interface MotherDuckContextValue {
  evaluateQuery: (query: string) => Promise<MaterializedQueryResult>;
  safeEvaluateQuery: (query: string) => Promise<SafeQueryResult<MaterializedQueryResult>>;
  setToken: (token: string) => void;
}

export const MotherDuckContext = createContext<MotherDuckContextValue | null>(null);

export function MotherDuckClientProvider({ children, database }: { children: React.ReactNode, database?: string },) {
  const connectionRef = useRef<PromiseWithResolvers<MDConnection | undefined>>();
  const [currentToken, setCurrentToken] = useState<string>('');

  if (connectionRef.current === undefined) {
    connectionRef.current = Promise.withResolvers<MDConnection | undefined>();
  }

  const evaluateQuery = async (query: string): Promise<MaterializedQueryResult> => {
    if (!connectionRef.current) {
      throw new Error('MotherDuck connection ref is falsy')
    }

    const connection = await connectionRef.current.promise;

    if (!connection) {
      throw new Error('No MotherDuck connection available');
    }

    return connection.evaluateQuery(query);
  };

  const safeEvaluateQuery = async (query: string): Promise<SafeQueryResult<MaterializedQueryResult>> => {
    if (!connectionRef.current) {
      throw new Error('MotherDuck connection ref is not initialized')
    }

    try {
      const connection = await connectionRef.current.promise;

      if (!connection) {
        throw new Error('No MotherDuck connection available. Please check your token and try again.');
      }

      console.log('Executing query with connection:', query);
      const result = await connection.safeEvaluateQuery(query);
      console.log('Query execution result:', result);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentToken) return;

    const initializeConnection = async () => {
      try {
        console.log('Initializing MotherDuck connection...');
        const result = await initMotherDuckConnection(currentToken, database);
        if (result) {
          console.log('MotherDuck connection initialized successfully');
          if (connectionRef.current) {
            connectionRef.current.resolve(result);
          }
        } else {
          throw new Error('Failed to initialize MotherDuck connection');
        }
      } catch (error) {
        console.error('Error initializing MotherDuck connection:', error);
        if (connectionRef.current) {
          connectionRef.current.reject(error);
        }
      }
    };
    
    // Reset connection promise when token changes
    connectionRef.current = Promise.withResolvers<MDConnection | undefined>();
    initializeConnection();
  }, [currentToken, database]);

  const value = useMemo(() => ({
    evaluateQuery,
    safeEvaluateQuery,
    setToken: setCurrentToken,
  }), [setCurrentToken]);

  return (
    <MotherDuckContext.Provider value={value}>
      {children}
    </MotherDuckContext.Provider>
  );
}

export function useMotherDuckClientState() {
  const context = useContext(MotherDuckContext);
  if (!context) {
    throw new Error('useMotherDuckClientState must be used within MotherDuckClientStateProvider');
  }
  return context;
}
