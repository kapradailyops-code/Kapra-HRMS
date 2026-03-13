import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// PATCH: Manager/HR approves or rejects an attendance exception
export async function PATCH(request: Request, { params }: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const isManager = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session.user?.role || '');
        if (!isManager) return new NextResponse("Forbidden", { status: 403 });

        const { id } = await params;
        const body = await request.json();
        const { status } = body; // "APPROVED" or "REJECTED"

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return new NextResponse("Invalid status. Must be APPROVED or REJECTED.", { status: 400 });
        }

        // Find the approver's user ID
        const approverUser = await prisma.user.findUnique({ where: { email: session.user.email } });

        // Update the exception record
        const exception = await prisma.attendanceException.update({
            where: { id },
            data: { status, approverId: approverUser?.id }
        });

        if (status === "APPROVED") {
            // On approval: create or update the AttendanceRecord as EXCEPTION
            await prisma.attendanceRecord.upsert({
                where: {
                    employeeId_date: {
                        employeeId: exception.employeeId,
                        date: exception.date
                    }
                },
                update: {
                    status: "EXCEPTION",
                    notes: exception.reason || "Approved attendance exception"
                },
                create: {
                    employeeId: exception.employeeId,
                    date: exception.date,
                    clockIn: exception.date,
                    status: "EXCEPTION",
                    notes: exception.reason || "Approved attendance exception"
                }
            });
        }

        return NextResponse.json(exception);
    } catch (error) {
        console.error("[ATTENDANCE_EXCEPTION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
