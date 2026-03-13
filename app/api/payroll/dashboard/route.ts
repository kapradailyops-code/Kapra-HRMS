import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

        // Generate past 3 months ranges
        const now = new Date();
        const monthsRange = Array.from({ length: 3 }).map((_, i) => {
            const date = subMonths(now, i);
            return {
                start: startOfMonth(date),
                end: endOfMonth(date),
                year: date.getFullYear(),
                month: date.getMonth()
            };
        });

        // We fetch leaves and attendance from x months ago to now
        const minStartDate = monthsRange[2].start;

        if (!isAdmin) {
             // For standard employees, return only their data
             const employeeObj = await fetchEmployeePayrollData(user?.employee?.id, minStartDate, monthsRange);
             if (!employeeObj) return new NextResponse("Not Found", { status: 404 });
             
             return NextResponse.json({
                 employees: [employeeObj]
             });
        } else {
             // Admin sees all
             const allEmployees = await prisma.employee.findMany();
             const results = [];
             for (const emp of allEmployees) {
                 const data = await fetchEmployeePayrollData(emp.id, minStartDate, monthsRange);
                 if (data) results.push(data);
             }

             return NextResponse.json({
                 employees: results
             });
        }
    } catch (error) {
        console.error("[PAYROLL_DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

async function fetchEmployeePayrollData(employeeId: string | undefined, minStartDate: Date, monthsRange: any[]) {
    if (!employeeId) return null;

    const employee = await prisma.employee.findUnique({
         where: { id: employeeId },
         include: {
             department: true
         }
    });

    if (!employee) return null;

    const leaveBalancesDb = await prisma.leaveBalance.findMany({
        where: { employeeId },
        include: { leaveType: true }
    });

    // Formatting LEAVE_BALANCES structure mapping to CL/SL/EL for the UI
    const leaveBalances: any = { CL: 0, SL: 0, EL: 0 };
    leaveBalancesDb.forEach(lb => {
        if (lb.leaveType.name.includes('Casual')) leaveBalances.CL = lb.balance;
        else if (lb.leaveType.name.includes('Sick')) leaveBalances.SL = lb.balance;
        else if (lb.leaveType.name.includes('Annual')) leaveBalances.EL = lb.balance;
    });

    // Fetch attendance records from past 3 months
    const attendanceRecordsDb = await prisma.attendanceRecord.findMany({
        where: {
            employeeId,
            date: { gte: minStartDate }
        }
    });

    // Fetch approved leave requests from past 3 months
    const leaveRequestsDb = await prisma.leaveRequest.findMany({
        where: {
            employeeId,
            status: "APPROVED",
            startDate: { gte: minStartDate }
        },
        include: { leaveType: true }
    });

    // Fetch pending exception requests (not yet approved)
    const pendingExceptionsDb = await prisma.attendanceException.findMany({
        where: {
            employeeId,
            status: "PENDING",
            date: { gte: minStartDate }
        }
    });

    // Generate formatted attendance array grouped by month for the UI
    const todayStr = new Date().toISOString().split('T')[0];

    const formattedAttendance = monthsRange.map(mr => {
        const daysInMonth = new Date(mr.year, mr.month + 1, 0).getDate();
        const days = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
             const date = new Date(mr.year, mr.month, day);
             const dow = date.getDay();
             const dateStr = date.toISOString().split('T')[0];
             
             if (dow === 0 || dow === 6) {
                 days.push({ date: day, status: "WEEKEND" });
             } else if (dateStr > todayStr) {
                 // Future dates should never be marked as absent
                 days.push({ date: day, status: "FUTURE" });
             } else {
                 // Check if there is an attendance record
                 const attRec = attendanceRecordsDb.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
                 
                 // Check if there is an approved leave
                 const LR = leaveRequestsDb.find(lr => {
                      const startStr = new Date(lr.startDate).toISOString().split('T')[0];
                      const endStr = new Date(lr.endDate).toISOString().split('T')[0];
                      return dateStr >= startStr && dateStr <= endStr;
                 });

                 let status = "ABSENT";
                 if (LR) {
                      if (LR.leaveType.name.includes('Casual')) status = "CL";
                      else if (LR.leaveType.name.includes('Sick')) status = "SL";
                      else if (LR.leaveType.name.includes('Annual')) status = "EL";
                      else status = "CL"; // fallback
                 } else if (attRec) {
                      // Preserve all recorded attendance statuses including EXCEPTION
                      status = ["PRESENT","LATE","HALF_DAY","EXCEPTION"].includes(attRec.status)
                          ? attRec.status
                          : "PRESENT";
                 } else {
                      // Check if there's a pending exception for this day
                      const pendingEx = pendingExceptionsDb.find(
                          ex => new Date(ex.date).toISOString().split('T')[0] === dateStr
                      );
                      if (pendingEx) status = "PENDING";
                 }

                 days.push({ date: day, status, dateStr });
             }
        }

        return {
            year: mr.year,
            month: mr.month,
            days
        };
    });

    return {
         id: employee.id,
         employeeId: employee.employeeId,
         name: `${employee.firstName} ${employee.lastName}`,
         department: employee.department?.name || 'Unassigned',
         grossSalary: employee.grossSalary || 0,
         leaveBalances,
         attendance: formattedAttendance
    };
}
