import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";
import NavLink from "../components/NavLink";
import { ToastProvider } from "../components/ToastProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const isManager = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session?.user?.role || '');
  const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session?.user?.role || '');
  const initials = (session.user?.email?.[0] ?? "?").toUpperCase();

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Kapra HRMS</h1>
          </div>

          <nav className="flex-1 mt-4 px-3 space-y-0.5 overflow-y-auto pb-4">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Employee</p>
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/dashboard/leaves" label="Leaves & Attendance" />
            <NavLink href="/dashboard/payroll" label="Payslips" />
            <NavLink href="/dashboard/goals" label="My Goals" />
            <NavLink href="/dashboard/policies" label="Policies" />
            <NavLink href="/dashboard/employees" label="Directory" />

            {isManager && (
              <>
                <p className="px-3 pt-4 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Team</p>
                <NavLink href="/dashboard/leaves/approvals" label="Leave Approvals" />
                <NavLink href="/dashboard/performance" label="Team Performance" />
              </>
            )}

            {isAdmin && (
              <>
                <p className="px-3 pt-4 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Management</p>
                <NavLink href="/dashboard/admin/analytics" label="Analytics" />
                <NavLink href="/dashboard/admin/payroll" label="Payroll" />
                <NavLink href="/dashboard/admin/policies" label="Policy Management" />
                <NavLink href="/dashboard/admin/leave-policies" label="Leave Policies" />
                <NavLink href="/dashboard/admin/audit-logs" label="Audit Logs" />
                <NavLink href="/dashboard/admin/api-keys" label="API Keys" />
              </>
            )}
          </nav>

          {/* User Info + Sign Out */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.email}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{session.user?.role?.replace(/_/g, ' ').toLowerCase()}</p>
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
              className="mt-3"
            >
              <button type="submit" className="w-full text-left text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-1">
                Sign out →
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
