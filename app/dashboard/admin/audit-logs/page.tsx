"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

type AuditLog = {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string | null;
    createdAt: string;
    user?: { email: string };
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState("");
    const [filterEntity, setFilterEntity] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterAction) params.append("action", filterAction);
            if (filterEntity) params.append("entityType", filterEntity);

            const res = await fetch(`/api/admin/audit?${params.toString()}`);
            if (res.ok) setLogs(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterAction, filterEntity]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Security Audit Logs</h1>
                <p className="mt-1 text-sm text-gray-500">Review critical system actions, data mutations, and access logs.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-end">
                <div className="w-1/4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Filter By Action</label>
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">All Actions</option>
                        <option value="UPDATE_LEAVE">Update Leave</option>
                        <option value="CREATE_USER">Create User</option>
                        <option value="UPDATE_GOAL">Update Goal</option>
                    </select>
                </div>
                <div className="w-1/4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Filter By Entity</label>
                    <select
                        value={filterEntity}
                        onChange={(e) => setFilterEntity(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">All Entities</option>
                        <option value="LeaveRequest">Leave Request</option>
                        <option value="Employee">Employee</option>
                        <option value="User">User</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actor</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Target ID</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading audit trail...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No logs found matching criteria.</td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                        {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {log.user?.email || <span className="text-gray-400 italic">System</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-blue-50 text-blue-700">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                        {log.entityType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400 hidden md:table-cell">
                                        {log.entityId.substring(0, 12)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
