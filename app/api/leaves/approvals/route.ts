import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { sendLeaveApprovalEmail } from "../../../../lib/email";
import { buildIcsString } from "../../../../lib/calendar";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        // Admins see all pending, managers see their subordinates' pending
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role);

        let whereClause: any = { status: "PENDING" };
        if (!isAdmin && user.employee) {
            whereClause.employee = { managerId: user.employee.id };
        } else if (!isAdmin && !user.employee) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const requests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                employee: true,
                leaveType: true
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("[LEAVE_APPROVALS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const body = await request.json();
        const { requestId, status } = body; // status: APPROVED or REJECTED

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: {
                leaveType: true,
                employee: {
                    include: { user: true }
                }
            }
        });

        if (!leaveRequest) return new NextResponse("Not found", { status: 404 });

        // Calculate days for balance deduction if approved (simple diff for now)
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((new Date(leaveRequest.endDate).getTime() - new Date(leaveRequest.startDate).getTime()) / msPerDay) + 1;

        // Update Request
        const updatedRequest = await prisma.$transaction(async (tx) => {
            const req = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    approverId: user.id
                }
            });

            // If approved, deduct balance
            if (status === 'APPROVED') {
                const balance = await tx.leaveBalance.findUnique({
                    where: {
                        employeeId_leaveTypeId: {
                            employeeId: leaveRequest.employeeId,
                            leaveTypeId: leaveRequest.leaveTypeId
                        }
                    }
                });

                if (balance) {
                    // Deduct from carryOver first, then regular balance
                    let remainingToDeduct = days;
                    let newCarryOver = balance.carryOverBalance;
                    let newBalance = balance.balance;

                    if (newCarryOver >= remainingToDeduct) {
                        newCarryOver -= remainingToDeduct;
                        remainingToDeduct = 0;
                    } else {
                        remainingToDeduct -= newCarryOver;
                        newCarryOver = 0;
                        newBalance -= remainingToDeduct;
                    }

                    await tx.leaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            carryOverBalance: newCarryOver,
                            balance: newBalance
                        }
                    });
                }
            }
            return req;
        });

        // Trigger Notification
        if (status === 'APPROVED' && leaveRequest.employee.user?.email) {
            const ics = buildIcsString(
                `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
                leaveRequest.leaveType.name,
                new Date(leaveRequest.startDate),
                new Date(leaveRequest.endDate)
            );

            // Send email asynchronously (don't block the response)
            sendLeaveApprovalEmail(
                leaveRequest.employee.user.email,
                leaveRequest.employee.firstName,
                leaveRequest.leaveType.name,
                new Date(leaveRequest.startDate).toLocaleDateString(),
                new Date(leaveRequest.endDate).toLocaleDateString(),
                ics
            ).catch(console.error);
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("[LEAVE_APPROVALS_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
