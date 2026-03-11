import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { sendGoalAssignedEmail } from "../../../lib/email";

// GET /api/goals – returns goals for the current employee (or all for admin)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

        if (employeeId && isAdmin) {
            // Admins/Managers can view any employee's goals
            const goals = await prisma.goal.findMany({
                where: { employeeId },
                orderBy: { dueDate: 'asc' }
            });
            return NextResponse.json(goals);
        }

        // All other users see only their own
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });
        if (!user?.employee) return NextResponse.json([]);

        const goals = await prisma.goal.findMany({
            where: { employeeId: user.employee.id },
            orderBy: { dueDate: 'asc' }
        });
        return NextResponse.json(goals);
    } catch (error) {
        console.error("[GOALS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/goals – create a new goal
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });
        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const { title, description, dueDate, status } = await request.json();

        if (!title || !dueDate) {
            return new NextResponse("Title and Due Date are required", { status: 400 });
        }

        const goal = await prisma.goal.create({
            data: {
                employeeId: user.employee.id,
                title,
                description,
                dueDate: new Date(dueDate),
                status: status || 'NOT_STARTED'
            }
        });

        // Trigger email notification asynchronously
        if (user.email && user.employee) {
            sendGoalAssignedEmail(
                user.email,
                user.employee.firstName,
                goal.title,
                goal.dueDate.toLocaleDateString()
            ).catch(console.error);
        }

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error("[GOALS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
