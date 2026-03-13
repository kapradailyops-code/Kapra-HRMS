"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileActions({ employee, canEdit, isAdmin }: { employee: any, canEdit: boolean, isAdmin: boolean }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit form state
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    jobTitle: employee.jobTitle || "",
    contactNumber: employee.contactNumber || "",
    address: employee.address || "",
    employmentType: employee.employmentType || "",
    workLocation: employee.workLocation || "",
    status: employee.status
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditOpen(false);
        router.refresh(); // Refresh current page to show updated data
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteOpen(false);
        router.push("/dashboard/employees"); // Redirect to directory
        router.refresh();
      } else {
        alert("Failed to delete employee.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting employee.");
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && !isAdmin) return null;

  return (
    <div className="flex gap-3 mt-4 md:mt-0">
      {canEdit && (
        <button onClick={() => setIsEditOpen(true)} className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 border border-gray-200 transition-colors shadow-sm">
          Edit Profile
        </button>
      )}
      {isAdmin && employee.status !== 'TERMINATED' && (
        <button onClick={() => setIsDeleteOpen(true)} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 border border-red-200 transition-colors shadow-sm">
          Terminate Employee
        </button>
      )}
      {isAdmin && employee.status === 'TERMINATED' && (
        <button disabled className="px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-semibold border border-gray-200 shadow-sm cursor-not-allowed">
          Terminated
        </button>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                 <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
             </div>
             <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                         <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                         <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label>
                         <input value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Employment Type</label>
                         <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black bg-white">
                             <option value="">Select...</option>
                             <option value="FULL_TIME">Full Time</option>
                             <option value="PART_TIME">Part Time</option>
                             <option value="CONTRACT">Contract</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Number</label>
                         <input value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">Work Location</label>
                         <input value={formData.workLocation} onChange={e => setFormData({...formData, workLocation: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black" />
                     </div>
                 </div>
                 <div>
                     <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                     <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black h-20" />
                 </div>
                 {isAdmin && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full text-sm border border-gray-300 rounded p-2 text-black bg-white">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="ON_LEAVE">ON LEAVE</option>
                        </select>
                    </div>
                 )}
                 <div className="pt-4 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded font-medium">Cancel</button>
                     <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50">
                         {loading ? "Saving..." : "Save Changes"}
                     </button>
                 </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete/Terminate Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Terminate {employee.firstName} {employee.lastName}?</h3>
             <p className="text-sm text-gray-500 mb-6 px-4">This will change their status to TERMINATED and immediately revoke their system access. Their historical records will be safely retained in the system for 3 months.</p>
             <div className="flex flex-col sm:flex-row justify-center gap-3">
                 <button onClick={() => setIsDeleteOpen(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 w-full sm:w-auto">
                     Cancel
                 </button>
                 <button onClick={handleDelete} disabled={loading} className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto">
                     {loading ? "Terminating..." : "Yes, Terminate Employee"}
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
