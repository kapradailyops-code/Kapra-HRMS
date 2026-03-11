"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Employee = {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    status: string;
    user: { email: string; role: string };
    department: { name: string } | null;
    manager: { firstName: string; lastName: string } | null;
};

export default function EmployeeTable({
    employees,
    isAdmin,
    departments,
}: {
    employees: Employee[];
    isAdmin: boolean;
    departments: string[];
}) {
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return employees.filter((emp) => {
            const matchesSearch =
                !q ||
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
                emp.user.email.toLowerCase().includes(q) ||
                (emp.jobTitle?.toLowerCase().includes(q) ?? false);
            const matchesDept = deptFilter === "all" || emp.department?.name === deptFilter;
            const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [employees, search, deptFilter, statusFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Employee Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">{filtered.length} of {employees.length} employees</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/employees/new"
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        + Add Employee
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, email, or title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                </div>
                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                    <option value="all">All Departments</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                    <option value="all">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="TERMINATED">Terminated</option>
                </select>
                {(search || deptFilter !== "all" || statusFilter !== "all") && (
                    <button
                        onClick={() => { setSearch(""); setDeptFilter("all"); setStatusFilter("all"); }}
                        className="text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Job Title</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {filtered.map((emp) => (
                                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 min-w-[40px] rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">{emp.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{emp.jobTitle || '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{emp.department?.name || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${emp.status === 'ACTIVE' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' :
                                                emp.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                                                    'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/employees/${emp.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            View Profile →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        No employees match your search.
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
