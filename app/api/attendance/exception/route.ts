export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

// POST: Employee submits an attendance exception request (creates PENDING record)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();
        const { date, reason } = body;

        if (!date) return new NextResponse("Missing required field: date", { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return new NextResponse("Employee record not found", { status: 404 });

        const employeeId = user.employee.id;
        const targetDate = new Date(date);
        const todayStr = new Date().toISOString().split('T')[0];
        const dateStr = targetDate.toISOString().split('T')[0];

        if (dateStr > todayStr) {
            return new NextResponse("Cannot submit exception for a future date", { status: 400 });
        }

        // Upsert: allow re-submitting a rejected exception
        const exception = await prisma.attendanceException.upsert({
            where: { employeeId_date: { employeeId, date: targetDate } },
            update: { reason, status: "PENDING", approverId: null },
            create: { employeeId, date: targetDate, reason, status: "PENDING" }
        });

        return NextResponse.json(exception);
    } catch (error) {
        console.error("[ATTENDANCE_EXCEPTION_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET: Manager/HR fetches all PENDING exception requests for their team
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const isManager = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session.user?.role || '');
        if (!isManager) return new NextResponse("Forbidden", { status: 403 });

        const exceptions = await prisma.attendanceException.findMany({
            where: { status: "PENDING" },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json(exceptions);
    } catch (error) {
        console.error("[ATTENDANCE_EXCEPTION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

