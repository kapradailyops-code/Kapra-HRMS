import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");

        if (!employeeId) {
            return new NextResponse("Missing Employee ID", { status: 400 });
        }

        const balances = await prisma.leaveBalance.findMany({
            where: { employeeId: employeeId },
            include: {
                leaveType: true
            }
        });

        return NextResponse.json(balances);
    } catch (error) {
        console.error("[LEAVE_BALANCES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
