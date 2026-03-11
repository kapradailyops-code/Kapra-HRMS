"use client";

import { useState } from "react";
import { format } from "date-fns";

type Document = {
    id: string;
    employeeId: string;
    title: string;
    documentUrl: string;
    documentType: string;
    uploadedAt: string;
};

export default function DocumentList({
    employeeId,
    initialDocs,
    canEdit
}: {
    employeeId: string;
    initialDocs: Document[];
    canEdit: boolean;
}) {
    const [documents, setDocuments] = useState<Document[]>(initialDocs);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", "GENERAL"); // Default to general type for now

        try {
            const res = await fetch(`/api/employees/${employeeId}/documents`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const newDoc = await res.json();
                setDocuments([newDoc, ...documents]);
            } else {
                alert("Failed to upload document");
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading document");
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = "";
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Documents ({documents.length})</h3>
                {canEdit && (
                    <label className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">
                        {uploading ? "Uploading..." : "Upload File"}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            {documents.length > 0 ? (
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={doc.title}>{doc.title}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(doc.uploadedAt), 'MMM d, yyyy')} • {doc.documentType}</p>
                                </div>
                            </div>
                            <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-600 transition-colors shrink-0 ml-2"
                                title="View Document"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
            )}
        </div>
    );
}
