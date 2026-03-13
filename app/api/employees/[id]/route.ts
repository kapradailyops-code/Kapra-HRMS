import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(
    request: Request,
    { params }: any
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const employee = await prisma.employee.findUnique({
            where: {
                id: id,
            },
            include: {
                user: { select: { email: true, role: true } },
                department: true,
                manager: { select: { id: true, firstName: true, lastName: true } },
                subordinates: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                documents: true,
                leaveBalances: {
                    include: {
                        leaveType: true,
                    }
                },
            },
        });

        if (!employee) {
            return new NextResponse("Employee not found", { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error("[EMPLOYEE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: any
) {
    try {
        const session = await auth();
        // Only allow Admins and HR to update employees
        if (!session || !['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const json = await request.json();

        // Extracted updatable fields
        const {
            firstName, lastName, contactNumber, address,
            jobTitle, employmentType, workLocation,
            departmentId, managerId, status
        } = json;

        const employee = await prisma.employee.update({
            where: {
                id: id,
            },
            data: {
                firstName,
                lastName,
                contactNumber,
                address,
                jobTitle,
                employmentType,
                workLocation,
                departmentId: departmentId || null,
                managerId: managerId || null,
                status
            },
            include: {
                user: { select: { email: true, role: true } },
                department: true,
                manager: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error("[EMPLOYEE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: any
) {
    try {
        const session = await auth();
        // Only allow Admins and HR to delete/terminate employees
        if (!session || !['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const employee = await prisma.employee.update({
            where: {
                id: id,
            },
            data: {
                status: 'TERMINATED'
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error("[EMPLOYEE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
