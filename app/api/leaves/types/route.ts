export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const leaveTypes = await prisma.leaveType.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(leaveTypes);
    } catch (error) {
        console.error("[LEAVE_TYPES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const {
            name, description, accrualRate, accrualPeriod, requiresApproval,
            maxCarryOver, carryOverExpiryMonths, probationPeriodMonths, isProrated
        } = body;

        const leaveType = await prisma.leaveType.create({
            data: {
                name,
                description,
                accrualRate: parseFloat(accrualRate),
                accrualPeriod,
                requiresApproval: requiresApproval ?? true,
                maxCarryOver: maxCarryOver ? parseFloat(maxCarryOver) : 0,
                carryOverExpiryMonths: carryOverExpiryMonths ? parseInt(carryOverExpiryMonths) : null,
                probationPeriodMonths: probationPeriodMonths ? parseInt(probationPeriodMonths) : 0,
                isProrated: isProrated ?? true
            }
        });

        return NextResponse.json(leaveType);
    } catch (error) {
        console.error("[LEAVE_TYPES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

