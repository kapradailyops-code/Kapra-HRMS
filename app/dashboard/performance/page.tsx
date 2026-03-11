"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../../components/ToastProvider";

const RATING_LABELS: Record<number, string> = { 1: "Unsatisfactory", 2: "Needs Improvement", 3: "Meets Expectations", 4: "Exceeds Expectations", 5: "Outstanding" };
const RATING_COLORS: Record<number, string> = { 1: "text-red-600", 2: "text-orange-500", 3: "text-yellow-600", 4: "text-blue-600", 5: "text-green-600" };

export default function TeamPerformancePage() {
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchReviews();
        fetchTeamMembers();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reviews");
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchTeamMembers = async () => {
        try {
            const res = await fetch("/api/employees");
            const data = await res.json();
            setTeamMembers(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        const formData = new FormData(e.currentTarget);
        const payload = {
            revieweeId: formData.get("revieweeId"),
            period: formData.get("period"),
            rating: parseInt(formData.get("rating") as string),
            comments: formData.get("comments"),
            status: "SUBMITTED"
        };
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            setShowModal(false);
            showToast('Review submitted successfully!', 'success');
            await fetchReviews();
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || 'Failed to submit review.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Performance</h1>
                    <p className="mt-1 text-sm text-gray-500">Review and manage performance evaluations for your team.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                    + Write Review
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="font-semibold text-gray-800">No reviews submitted yet</p>
                        <p className="text-sm text-gray-500 mt-1">Write the first review for your team.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {reviews.map((review) => (
                            <li key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 min-w-[40px] rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold uppercase text-sm">
                                            {review.reviewee?.firstName?.[0]}{review.reviewee?.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{review.reviewee?.firstName} {review.reviewee?.lastName}</p>
                                            <p className="text-xs text-gray-500">{review.reviewee?.jobTitle || "Employee"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Period</p>
                                            <p className="text-sm font-semibold text-gray-700 mt-0.5">{review.period}</p>
                                        </div>
                                        {review.rating && (
                                            <div className="text-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                                <p className={`text-2xl font-extrabold ${RATING_COLORS[review.rating] || 'text-gray-700'}`}>{review.rating}<span className="text-gray-300 text-base font-normal">/5</span></p>
                                                <p className={`text-xs font-semibold mt-0.5 ${RATING_COLORS[review.rating] || 'text-gray-500'}`}>{RATING_LABELS[review.rating]}</p>
                                            </div>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${review.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : review.status === 'ACKNOWLEDGED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {review.status}
                                        </span>
                                    </div>
                                </div>
                                {review.comments && (
                                    <div className="mt-4 ml-14 text-sm text-gray-600 italic bg-gray-50 border-l-4 border-gray-200 pl-4 py-2 pr-4 rounded-r-lg">
                                        "{review.comments}"
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-3 ml-14">Reviewed by {review.reviewer?.firstName} {review.reviewer?.lastName} &middot; {format(new Date(review.createdAt), 'MMM d, yyyy')}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Write Performance Review</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee *</label>
                                <select name="revieweeId" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm bg-white">
                                    <option value="">Select employee...</option>
                                    {teamMembers.map((e: any) => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Period *</label>
                                <input name="period" required className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="e.g. Q1 2026 or 2026 Annual Review" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(r => {
                                        const inputId = `rating-${r}`;
                                        return (
                                            <label key={r} htmlFor={inputId} className="cursor-pointer">
                                                <input type="radio" id={inputId} name="rating" value={r} required className="sr-only peer" />
                                                <div className="rounded-xl border-2 border-gray-200 p-3 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                                                    <p className="text-xl font-bold text-gray-800 peer-checked:text-blue-700">{r}</p>
                                                    <p className="text-[10px] text-gray-500 leading-tight mt-1">{RATING_LABELS[r].split(" ")[0]}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comments</label>
                                <textarea name="comments" rows={4} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm resize-none" placeholder="Share detailed feedback..." />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {submitting ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
