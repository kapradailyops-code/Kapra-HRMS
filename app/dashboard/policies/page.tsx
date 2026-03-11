"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../../components/ToastProvider";

const CATEGORY_ICONS: Record<string, string> = {
    "Leave & Time Off": "🌴",
    "Code of Conduct": "📋",
    "Workplace Safety": "🦺",
    "Compensation & Benefits": "💰",
    "Remote Work": "🏠",
    "IT & Security": "🔐",
    "General": "📄",
};

export default function PoliciesPage() {
    const { showToast } = useToast();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        fetch("/api/policies")
            .then(r => r.json())
            .then(d => { setPolicies(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => { showToast("Failed to load policies.", "error"); setLoading(false); });
    }, []);

    const categories = ["All", ...Array.from(new Set(policies.map(p => p.category)))];
    const filtered = activeCategory === "All" ? policies : policies.filter(p => p.category === activeCategory);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Policies</h1>
                <p className="mt-1 text-sm text-gray-500">Browse and read HR policies, guidelines, and procedures.</p>
            </div>

            {/* Category Filter Tabs */}
            {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeCategory === cat
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="font-semibold text-gray-700">No policies published yet</p>
                    <p className="text-sm text-gray-400 mt-1">Check back soon — HR will publish policies here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(policy => (
                        <button
                            key={policy.id}
                            onClick={() => setSelected(policy)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left hover:border-blue-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-2xl">{CATEGORY_ICONS[policy.category] || "📄"}</span>
                                {policy.version && (
                                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{policy.version}</span>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">{policy.title}</h3>
                            <p className="text-xs text-blue-600 font-semibold mt-1">{policy.category}</p>
                            {policy.summary && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{policy.summary}</p>}
                            {policy.effectiveDate && (
                                <p className="text-xs text-gray-400 mt-3">Effective {format(new Date(policy.effectiveDate), 'MMM d, yyyy')}</p>
                            )}
                            <p className="text-xs text-blue-500 font-medium mt-4 group-hover:underline">Read policy →</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Policy Reader Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full">{selected.category}</span>
                                    {selected.version && <span className="text-xs text-gray-400 font-semibold">{selected.version}</span>}
                                </div>
                                <h2 className="text-xl font-extrabold text-gray-900">{selected.title}</h2>
                                {selected.effectiveDate && (
                                    <p className="text-xs text-gray-400 mt-1">Effective {format(new Date(selected.effectiveDate), 'MMMM d, yyyy')} · Last updated {format(new Date(selected.updatedAt), 'MMM d, yyyy')}</p>
                                )}
                            </div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Policy Content */}
                        <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
                            {selected.summary && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">
                                    <p className="text-sm text-blue-800 leading-relaxed font-medium italic">{selected.summary}</p>
                                </div>
                            )}
                            <div className="prose prose-sm prose-gray max-w-none">
                                {selected.content.split('\n').map((line: string, i: number) => {
                                    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(3)}</h2>;
                                    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-extrabold text-gray-900 mt-4 mb-2">{line.slice(2)}</h1>;
                                    if (line.startsWith('- ')) return <li key={i} className="text-sm text-gray-700 ml-4 mb-1 list-disc">{line.slice(2)}</li>;
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i} className="text-sm text-gray-700 mb-2 leading-relaxed">{line}</p>;
                                })}
                            </div>
                        </div>

                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button onClick={() => setSelected(null)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
