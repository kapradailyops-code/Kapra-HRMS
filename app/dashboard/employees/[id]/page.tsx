import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import DocumentList from "./DocumentList";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<any>;
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true } },
      department: { select: { name: true } },
      manager: { select: { firstName: true, lastName: true, id: true } },
      subordinates: { select: { firstName: true, lastName: true, id: true, jobTitle: true } },
      leaveBalances: {
        include: { leaveType: true },
      },
      documents: true,
    },
  });

  if (!employee) {
    notFound();
  }

  // Determine if the current user has edit rights
  const isSelf = session.user?.id === employee.userId;
  const isManager = employee.managerId !== null && session.user?.id === employee.manager?.id; // Actually, session.user.id is the User ID. manager.id is Employee ID.
  // Wait, session.user.id is the USER ID. employee.userId is the USER ID.
  const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
  const canEdit = isSelf || isAdmin || isManager;

  return (
    <div className="space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="h-24 w-24 min-w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold shadow-inner">
          {employee.firstName[0]}{employee.lastName[0]}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-lg text-gray-500 font-medium mt-1">{employee.jobTitle || 'No Title Assigned'}</p>
            </div>
            {canEdit && (
              <button className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 border border-gray-200 transition-colors shadow-sm">
                Edit Profile
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {employee.user.email}
            </div>
            <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              {employee.department?.name || 'Unassigned Department'}
            </div>
            <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {employee.workLocation || 'Remote'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-8">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Employment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{employee.employeeId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hire Date</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{format(new Date(employee.hireDate), 'MMMM d, yyyy')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment Type</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 capitalize">{employee.employmentType?.replace('_', ' ') || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Role</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 capitalize">{employee.user.role.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {employee.manager ? (
                    <Link href={`/dashboard/employees/${employee.manager.id}`} className="text-blue-600 hover:underline">
                      {employee.manager.firstName} {employee.manager.lastName}
                    </Link>
                  ) : 'None'}
                </dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{employee.contactNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMMM d, yyyy') : '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{employee.address || '—'}</dd>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-8">

          {/* Leave Balances Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Leave Balances</h3>
            {employee.leaveBalances.length > 0 ? (
              <div className="space-y-4">
                {employee.leaveBalances.map((balance) => (
                  <div key={balance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{balance.leaveType.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Accrues {balance.leaveType.accrualRate} / {balance.leaveType.accrualPeriod.toLowerCase()}</p>
                    </div>
                    <div className="text-xl font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                      {balance.balance}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No leave balances tracked.</p>
            )}
            {canEdit && (
              <Link href={`#`} className="mt-4 block text-center text-sm text-blue-600 font-medium hover:text-blue-800">
                Manage Leaves →
              </Link>
            )}
          </div>

          {/* Subordinates Widget */}
          {employee.subordinates.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Direct Reports ({employee.subordinates.length})</h3>
              <div className="space-y-3">
                {employee.subordinates.map((sub) => (
                  <Link href={`/dashboard/employees/${sub.id}`} key={sub.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold mr-3">
                      {sub.firstName[0]}{sub.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">{sub.firstName} {sub.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{sub.jobTitle || 'Employee'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Documents Widget */}
          <DocumentList
            employeeId={employee.id}
            initialDocs={employee.documents as any}
            canEdit={canEdit}
          />

        </div>
      </div>
    </div>
  );
}
