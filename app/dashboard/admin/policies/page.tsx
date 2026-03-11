"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../../../components/ToastProvider";

const CATEGORIES = ["Leave & Time Off", "Code of Conduct", "Workplace Safety", "Compensation & Benefits", "Remote Work", "IT & Security", "General"];
const STATUS_STYLES: Record<string, string> = {
    true: "bg-green-100 text-green-700",
    false: "bg-gray-100 text-gray-500",
};

export default function AdminPoliciesPage() {
    const { showToast } = useToast();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [preview, setPreview] = useState<any | null>(null);

    useEffect(() => { fetchPolicies(); }, []);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            // Admin needs all policies including drafts — using a workaround since our GET handles it via session
            const res = await fetch("/api/policies");
            const d = await res.json();
            setPolicies(Array.isArray(d) ? d : []);
        } catch { showToast("Failed to load policies.", "error"); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (p: any) => { setEditing(p); setShowModal(true); };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const payload: any = {
            title: formData.get("title"),
            category: formData.get("category"),
            content: formData.get("content"),
            summary: formData.get("summary"),
            version: formData.get("version"),
            isPublished: formData.get("isPublished") === "true",
            effectiveDate: formData.get("effectiveDate") || null,
        };

        try {
            const url = editing ? `/api/policies/${editing.id}` : "/api/policies";
            const method = editing ? "PATCH" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await res.text());
            setShowModal(false);
            showToast(editing ? "Policy updated!" : "Policy created!", "success");
            await fetchPolicies();
        } catch (err: any) {
            showToast(err.message || "Failed to save policy.", "error");
        } finally {
            setSubmitting(false);
            setEditing(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setPolicies(policies.filter(p => p.id !== id));
            showToast("Policy deleted.", "info");
        } catch { showToast("Failed to delete policy.", "error"); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Policy Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Create, edit, and publish company-wide HR policies.</p>
                </div>
                <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors">
                    + New Policy
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Policies", value: policies.length, color: "text-gray-900" },
                    { label: "Published", value: policies.filter(p => p.isPublished).length, color: "text-green-700" },
                    { label: "Drafts", value: policies.filter(p => !p.isPublished).length, color: "text-amber-600" },
                ].map(c => (
                    <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className={`text-3xl font-extrabold ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">Loading policies...</div>
                ) : policies.length === 0 ? (
                    <div className="p-16 flex flex-col items-center text-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="font-semibold text-gray-700">No policies yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "+ New Policy" to get started.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {policies.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{p.title}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.category}</td>
                                    <td className="px-6 py-4 text-gray-400">{p.version || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[String(p.isPublished)]}`}>
                                            {p.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 tabular-nums">{format(new Date(p.updatedAt), 'MMM d, yyyy')}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setPreview(p)} className="text-xs text-blue-600 hover:underline font-medium">Preview</button>
                                        <button onClick={() => openEdit(p)} className="text-xs text-gray-600 hover:text-gray-900 hover:underline font-medium">Edit</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit Policy" : "New Policy"}</h3>
                            <button onClick={() => { setShowModal(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                                    <input name="title" required defaultValue={editing?.title} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="e.g. Annual Leave Policy" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                                    <select name="category" required defaultValue={editing?.category || CATEGORIES[0]} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Version</label>
                                    <input name="version" defaultValue={editing?.version} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="e.g. v1.0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Effective Date</label>
                                    <input type="date" name="effectiveDate" defaultValue={editing?.effectiveDate?.split("T")[0]} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                                    <select name="isPublished" defaultValue={String(editing?.isPublished ?? false)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm">
                                        <option value="false">Draft</option>
                                        <option value="true">Published</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Summary (shown on the card)</label>
                                    <input name="summary" defaultValue={editing?.summary} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="One-liner summary..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content * <span className="text-xs text-gray-400 font-normal">(supports # headings and - bullet points)</span></label>
                                    <textarea name="content" required rows={12} defaultValue={editing?.content} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-mono resize-y" placeholder="## Overview&#10;Write the policy content here...&#10;&#10;- Bullet point one&#10;- Bullet point two" />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {submitting ? "Saving..." : editing ? "Update Policy" : "Create Policy"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview modal reuse */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{preview.category}</span>
                                <h2 className="text-xl font-extrabold text-gray-900 mt-1">{preview.title}</h2>
                            </div>
                            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
                            {preview.summary && <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-5 text-sm text-blue-800 italic">{preview.summary}</div>}
                            {preview.content.split('\n').map((line: string, i: number) => {
                                if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">{line.slice(3)}</h2>;
                                if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-extrabold text-gray-900 mt-4 mb-2">{line.slice(2)}</h1>;
                                if (line.startsWith('- ')) return <li key={i} className="text-sm text-gray-700 ml-4 mb-1 list-disc">{line.slice(2)}</li>;
                                if (line.trim() === '') return <br key={i} />;
                                return <p key={i} className="text-sm text-gray-700 mb-2 leading-relaxed">{line}</p>;
                            })}
                        </div>
                        <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setPreview(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
