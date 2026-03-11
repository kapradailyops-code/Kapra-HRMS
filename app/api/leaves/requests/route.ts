import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const requests = await prisma.leaveRequest.findMany({
            where: { employeeId: user.employee.id },
            include: { leaveType: true, approver: { include: { employee: true } } },
            orderBy: { createdAt: "desc" },
        });

        // Also return balances
        const balances = await prisma.leaveBalance.findMany({
            where: { employeeId: user.employee.id },
            include: { leaveType: true }
        });

        return NextResponse.json({ requests, balances });
    } catch (error) {
        console.error("[LEAVE_REQUESTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const body = await request.json();
        const { leaveTypeId, startDate, endDate, reason } = body;

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: user.employee.id,
                leaveTypeId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: "PENDING",
            }
        });

        return NextResponse.json(leaveRequest);
    } catch (error) {
        console.error("[LEAVE_REQUESTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
