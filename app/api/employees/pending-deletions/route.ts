export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Find employees who were terminated more than 3 months ago but still exist
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const pendingDeletions = await prisma.employee.findMany({
            where: {
                status: 'TERMINATED',
                updatedAt: { lte: threeMonthsAgo }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                updatedAt: true,
                employeeId: true
            }
        });

        return NextResponse.json(pendingDeletions);
    } catch (error) {
        console.error("[DELETION_REMINDER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

