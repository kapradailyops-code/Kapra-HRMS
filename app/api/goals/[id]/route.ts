import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

// PATCH /api/goals/[id] – update a goal's status or details
export async function PATCH(request: Request, context: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        const { title, description, dueDate, status } = body;

        // Ensure the goal belongs to the current user or is an admin
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal) return new NextResponse("Goal not found", { status: 404 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (goal.employeeId !== user?.employee?.id && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(status && { status })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[GOAL_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/goals/[id]
export async function DELETE(request: Request, context: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await context.params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal) return new NextResponse("Goal not found", { status: 404 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (goal.employeeId !== user?.employee?.id && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.goal.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[GOAL_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
