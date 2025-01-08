'use client'

import { useState } from 'react';

interface TokenInputProps {
    tokenInput: string;
    onTokenChange: (token: string) => void;
}

export function TokenInput({ tokenInput, onTokenChange }: TokenInputProps) {
    const [error, setError] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            setError('Please upload a .txt file');
            return;
        }

        try {
            const text = await file.text();
            const token = text.trim();
            if (!token) {
                setError('The file appears to be empty');
                return;
            }
            onTokenChange(token);
            setError(null);
            setUploadedFileName(file.name);
        } catch (err) {
            setError('Failed to read the file');
            console.error('Error reading file:', err);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4 text-sm text-gray-600">
                <p>
                    Don't have a MotherDuck account?{' '}
                    <a
                        href="https://app.motherduck.com/?auth_flow=signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Sign up here
                    </a>{' '}
                    to get your token.
                </p>
            </div>

            <div className="space-y-4">
                {/* Manual Input */}
                <div>
                    <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">
                        MotherDuck Token
                    </label>
                    <input
                        type="password"
                        id="token"
                        value={tokenInput}
                        onChange={(e) => {
                            onTokenChange(e.target.value);
                            setError(null);
                            setUploadedFileName(null);
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white"
                        placeholder="Enter your MotherDuck token"
                    />
                </div>

                {/* File Upload */}
                <div>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-500">Or upload a token file</span>
                        <div className="flex-grow border-t border-gray-300 mx-4"></div>
                    </div>
                    <div className="mt-2">
                        <label
                            htmlFor="token-file"
                            className="flex justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-500 focus:outline-none"
                        >
                            <span className="flex items-center space-x-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <span className="font-medium text-gray-600">
                                    Drop your token file here, or{' '}
                                    <span className="text-blue-600 underline">browse</span>
                                </span>
                            </span>
                            <input
                                type="file"
                                id="token-file"
                                accept=".txt"
                                className="hidden"
                                onChange={handleFileUpload}
                                onClick={(e) => {
                                    // Reset the input value to allow uploading the same file again
                                    (e.target as HTMLInputElement).value = '';
                                    setError(null);
                                }}
                            />
                        </label>
                    </div>
                    {uploadedFileName && (
                        <div className="mt-2 text-green-600 text-sm">
                            Successfully uploaded: {uploadedFileName}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-red-500 text-sm mt-2">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
