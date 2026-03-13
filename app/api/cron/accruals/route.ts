export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Only allow via secret header in real app, skipping for demo manually

        // Get all active employees with their leave balances
        const employees = await prisma.employee.findMany({
            where: { status: 'ACTIVE' },
            include: {
                leaveBalances: { include: { leaveType: true } }
            }
        });

        // Get all available LeaveTypes to create missing balances
        const allLeaveTypes = await prisma.leaveType.findMany();

        const results = [];
        const now = new Date();

        for (const employee of employees) {
            const hireDate = new Date(employee.hireDate);
            const monthsEmployed = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

            // Check for missing balances and create them
            const existingTypeIds = employee.leaveBalances.map(lb => lb.leaveTypeId);
            let updatedBalances = [...employee.leaveBalances];

            for (const lt of allLeaveTypes) {
                if (!existingTypeIds.includes(lt.id)) {
                    const newBalance = await prisma.leaveBalance.create({
                        data: {
                            employeeId: employee.id,
                            leaveTypeId: lt.id,
                            balance: 0,
                            carryOverBalance: 0,
                            lastAccrual: hireDate,
                        },
                        include: { leaveType: true }
                    });
                    updatedBalances.push(newBalance);
                }
            }

            // Process Accruals
            for (const balance of updatedBalances) {
                const lt = balance.leaveType;
                if (monthsEmployed < lt.probationPeriodMonths) continue;

                const lastAccrual = balance.lastAccrual ? new Date(balance.lastAccrual) : hireDate;
                const monthsSinceLastAccrual = (now.getFullYear() - lastAccrual.getFullYear()) * 12 + (now.getMonth() - lastAccrual.getMonth());
                const yearsSinceLastAccrual = now.getFullYear() - lastAccrual.getFullYear();

                let accrualToAdd = 0;
                let carryOverChanges = { balance: balance.balance, carryOverBalance: balance.carryOverBalance };

                if (lt.accrualPeriod === 'MONTHLY' && monthsSinceLastAccrual >= 1) {
                    // Added rate * months passed since last accrual
                    accrualToAdd = lt.accrualRate * monthsSinceLastAccrual;
                } else if (lt.accrualPeriod === 'YEARLY' && yearsSinceLastAccrual >= 1) {
                    // Yearly reset and carryover process
                    accrualToAdd = lt.accrualRate * yearsSinceLastAccrual;

                    // Process carry over (Move unused current balance to carry over, limited by max)
                    let newCarryOver = Math.min(carryOverChanges.balance + carryOverChanges.carryOverBalance, lt.maxCarryOver);
                    carryOverChanges.carryOverBalance = newCarryOver;
                    carryOverChanges.balance = 0; // Reset main balance for the new year
                }

                if (accrualToAdd > 0 || carryOverChanges.balance !== balance.balance) {
                    await prisma.leaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            balance: carryOverChanges.balance + accrualToAdd,
                            carryOverBalance: carryOverChanges.carryOverBalance,
                            lastAccrual: now
                        }
                    });
                    results.push({ employee: employee.employeeId, leaveType: lt.name, added: accrualToAdd, carryOver: carryOverChanges.carryOverBalance });
                }
            }
        }

        return NextResponse.json({ message: "Accruals processed", processed: results.length, results });
    } catch (error) {
        console.error("[CRON_ACCRUALS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

