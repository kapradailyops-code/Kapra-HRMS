import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const { searchParams } = new URL(request.url);
        const history = searchParams.get("history") === "true";

        if (history) {
            // Return last 30 days of attendance records
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const records = await prisma.attendanceRecord.findMany({
                where: {
                    employeeId: user.employee.id,
                    date: { gte: thirtyDaysAgo }
                },
                orderBy: { date: 'desc' }
            });

            return NextResponse.json(records);
        }

        // Default: return today's record only
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: user.employee.id,
                date: { gte: todayStart, lte: todayEnd }
            }
        });

        return NextResponse.json(record || null);
    } catch (error) {
        console.error("[ATTENDANCE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}


export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const body = await request.json();
        const { action } = body; // action: 'CLOCK_IN' or 'CLOCK_OUT'

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: user.employee.id,
                date: {
                    gte: todayStart,
                    lte: todayEnd,
                }
            }
        });

        if (action === 'CLOCK_IN') {
            if (record) {
                return new NextResponse("Already clocked in today", { status: 400 });
            }
            record = await prisma.attendanceRecord.create({
                data: {
                    employeeId: user.employee.id,
                    date: new Date(),
                    clockIn: new Date(),
                    status: 'PRESENT'
                }
            });
        } else if (action === 'CLOCK_OUT') {
            if (!record) {
                return new NextResponse("Not clocked in today", { status: 400 });
            }
            if (record.clockOut) {
                return new NextResponse("Already clocked out today", { status: 400 });
            }
            record = await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: {
                    clockOut: new Date()
                }
            });
        } else {
            return new NextResponse("Invalid action", { status: 400 });
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error("[ATTENDANCE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
