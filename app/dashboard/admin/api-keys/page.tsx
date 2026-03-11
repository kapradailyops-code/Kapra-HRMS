"use client";

import { useState, useEffect } from "react";

type ApiToken = {
    id: string;
    name: string;
    token: string;
    scopes: string;
    createdAt: string;
    expiresAt: string | null;
};

export default function ApiKeysPage() {
    const [tokens, setTokens] = useState<ApiToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTokenName, setNewTokenName] = useState("");
    const [newlyGeneratedToken, setNewlyGeneratedToken] = useState<string | null>(null);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            const res = await fetch("/api/admin/tokens");
            if (res.ok) {
                const data = await res.json();
                setTokens(data);
            }
        } catch (error) {
            console.error("Failed to fetch tokens", error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTokenName })
            });
            if (res.ok) {
                const newToken = await res.json();
                setNewlyGeneratedToken(newToken.token); // Show only once
                fetchTokens();
                setNewTokenName("");
            }
        } catch (error) {
            console.error("Failed to generate token", error);
        }
    };

    if (isLoading) return <div className="p-6">Loading Developer Tokens...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Developer API Keys</h1>
                <p className="text-gray-600 mt-2">Manage restricted access keys used for third-party integrations.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Generate New Token</h2>
                <form onSubmit={generateToken} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Integration Name</label>
                        <input
                            type="text"
                            required
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Acme Payroll Software"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                        Generate API Token
                    </button>
                </form>

                {newlyGeneratedToken && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                            ⚠️ Copy this token now. You will not be able to see it again!
                        </p>
                        <code className="block p-3 bg-white border border-yellow-300 rounded font-mono text-sm break-all">
                            {newlyGeneratedToken}
                        </code>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Active API Tokens</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Prefix</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scopes</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {tokens.map((token) => (
                                <tr key={token.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{token.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-500">
                                        {token.token.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {token.scopes}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(token.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {tokens.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No API tokens generated yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
