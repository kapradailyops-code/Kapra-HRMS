export const dynamic = 'force-dynamic';
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { redis } from "../../../lib/redis";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Optimization: Check Redis Cache First
    const cacheKey = `employees:directory:${search || 'all'}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const employees = await prisma.employee.findMany({
      where: search ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { jobTitle: { contains: search } },
        ],
      } : {},
      include: {
        user: { select: { email: true, role: true } },
        department: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
      orderBy: { firstName: "asc" },
    });

    // Store in Redis (Expire in 60 seconds)
    await redis.set(cacheKey, JSON.stringify(employees), 'EX', 60);

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    // Only allow Admins and HR to create employees
    if (!session || !['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const {
      firstName, lastName, email, jobTitle,
      employmentType, hireDate, departmentId, managerId
    } = json;

    // Default password 'password123' for new profiles (in real app, this would be auto-generated and emailed)
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    // Generate a simple sequential Employee ID
    const count = await prisma.employee.count();
    const employeeId = `EMP-${(count + 1).toString().padStart(3, '0')}`;

    // Get the Leave Types
    const annualLeave = await prisma.leaveType.findUnique({ where: { name: 'Annual Leave' } });
    const sickLeave = await prisma.leaveType.findUnique({ where: { name: 'Sick Leave' } });
    const casualLeave = await prisma.leaveType.findUnique({ where: { name: 'Casual Leave' } });

    // Prepare leave balances
    const initialLeaveBalances = [];
    if (annualLeave) initialLeaveBalances.push({ leaveTypeId: annualLeave.id, balance: 18 });
    if (sickLeave) initialLeaveBalances.push({ leaveTypeId: sickLeave.id, balance: 12 });
    if (casualLeave) initialLeaveBalances.push({ leaveTypeId: casualLeave.id, balance: 6 });

    const newEmployee = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employee: {
          create: {
            employeeId,
            firstName,
            lastName,
            jobTitle,
            employmentType,
            hireDate: new Date(hireDate),
            departmentId: departmentId || null,
            managerId: managerId || null,
            leaveBalances: initialLeaveBalances.length > 0 ? {
              create: initialLeaveBalances
            } : undefined
          }
        }
      },
      include: {
        employee: true
      }
    });

    // Invalidate Cache after mutation
    await redis.del('employees:directory:all');

    return NextResponse.json(newEmployee.employee);
  } catch (error) {
    console.error("[EMPLOYEES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

