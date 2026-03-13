import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

export async function PATCH(request: Request, { params }: { params: any }) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) {
             return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = params;
        const AwaitedParams = await params;
        const targetId = AwaitedParams.id || id;
        const body = await request.json();

        if (body.grossSalary === undefined) {
             return new NextResponse("Missing grossSalary", { status: 400 });
        }

        const updatedEmployee = await prisma.employee.update({
             where: { id: targetId },
             data: {
                  grossSalary: parseFloat(body.grossSalary)
             }
        });

        return NextResponse.json(updatedEmployee);

    } catch (error) {
        console.error("[EMPLOYEE_SALARY_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
