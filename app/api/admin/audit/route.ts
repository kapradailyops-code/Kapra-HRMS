import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");
        const entityType = searchParams.get("entityType");

        const whereClause: any = {};
        if (action) whereClause.action = action;
        if (entityType) whereClause.entityType = entityType;

        const logs = await prisma.auditLog.findMany({
            where: whereClause,
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for prototype
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("[AUDIT_LOGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
