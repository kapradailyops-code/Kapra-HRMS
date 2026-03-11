import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

// GET /api/payroll — returns own payslips (or all if admin with ?employeeId)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(request.url);
        const employeeIdParam = searchParams.get("employeeId");
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (isAdmin && !employeeIdParam) {
            // Admin sees all records
            const records = await prisma.payrollRecord.findMany({
                include: { employee: { select: { firstName: true, lastName: true, jobTitle: true, employeeId: true } } },
                orderBy: [{ period: 'desc' }, { createdAt: 'desc' }]
            });
            return NextResponse.json(records);
        }

        const targetId = employeeIdParam || user?.employee?.id;
        if (!targetId) return NextResponse.json([]);

        // Non-admins can only view their own
        if (!isAdmin && targetId !== user?.employee?.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const records = await prisma.payrollRecord.findMany({
            where: { employeeId: targetId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(records);
    } catch (error) {
        console.error("[PAYROLL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/payroll — admin creates a payroll record for an employee
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        const { employeeId, period, basicSalary, deductions, notes, status } = await request.json();

        if (!employeeId || !period || basicSalary == null) {
            return new NextResponse("employeeId, period, and basicSalary are required", { status: 400 });
        }

        const netPay = parseFloat(basicSalary) - parseFloat(deductions || 0);

        const record = await prisma.payrollRecord.upsert({
            where: { employeeId_period: { employeeId, period } },
            update: { basicSalary: parseFloat(basicSalary), deductions: parseFloat(deductions || 0), netPay, notes, status },
            create: { employeeId, period, basicSalary: parseFloat(basicSalary), deductions: parseFloat(deductions || 0), netPay, notes, status: status || 'PROCESSED' }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error("[PAYROLL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
