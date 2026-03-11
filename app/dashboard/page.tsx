import { auth } from "../../auth"
import ClockInOut from "./ClockInOut"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Quick Stats Cards */}
      <ClockInOut />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Leave Balance</p>
          <p className="text-2xl font-bold text-gray-900">18 <span className="text-sm font-normal text-gray-400">Days</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
        <div className="p-3 bg-purple-50 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-sm text-gray-500">You are logged in as <strong className="text-gray-700">{session?.user?.role}</strong>.</p>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="flex items-start space-x-4">
            <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">System Update: HRMS Phase 1 Initialized</p>
              <p className="text-xs text-gray-500 mt-1">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
