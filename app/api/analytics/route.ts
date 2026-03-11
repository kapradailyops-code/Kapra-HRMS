import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        // --- Headcount by Department ---
        const headcountByDept = await prisma.organization.findMany({
            select: {
                name: true,
                _count: { select: { employees: { where: { status: 'ACTIVE' } } } }
            }
        });

        // --- Headcount by Employment Type ---
        const rawByType = await prisma.employee.groupBy({
            by: ['employmentType'],
            where: { status: 'ACTIVE' },
            _count: { id: true }
        });
        const headcountByType = rawByType.map(r => ({
            type: r.employmentType || 'UNSPECIFIED',
            count: r._count.id
        }));

        // --- Total Active Employees ---
        const totalActive = await prisma.employee.count({ where: { status: 'ACTIVE' } });

        // --- Leave Liability (days outstanding) ---
        const leaveLiability = await prisma.leaveBalance.aggregate({
            _sum: { balance: true, carryOverBalance: true }
        });

        // --- Leave Requests by status ---
        const leavesByStatus = await prisma.leaveRequest.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        // --- Most Submitted Leave Types ---
        const topLeaveTypes = await prisma.leaveRequest.groupBy({
            by: ['leaveTypeId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });
        const leaveTypeIds = topLeaveTypes.map(l => l.leaveTypeId);
        const leaveTypeNames = await prisma.leaveType.findMany({ where: { id: { in: leaveTypeIds } }, select: { id: true, name: true } });
        const leaveTypeNameMap = Object.fromEntries(leaveTypeNames.map(lt => [lt.id, lt.name]));
        const topLeaveTypesFormatted = topLeaveTypes.map(l => ({
            name: leaveTypeNameMap[l.leaveTypeId] || l.leaveTypeId,
            count: l._count.id
        }));

        return NextResponse.json({
            totalActive,
            headcountByDept: headcountByDept.map(d => ({ name: d.name, count: d._count.employees })),
            headcountByType,
            leaveLiabilityDays: (leaveLiability._sum.balance || 0) + (leaveLiability._sum.carryOverBalance || 0),
            leavesByStatus: leavesByStatus.map(l => ({ status: l.status, count: l._count.id })),
            topLeaveTypes: topLeaveTypesFormatted
        });
    } catch (error) {
        console.error("[ANALYTICS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
