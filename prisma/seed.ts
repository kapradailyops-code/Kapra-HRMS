import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // Seed Leave Types
  const annualLeave = await prisma.leaveType.upsert({
    where: { name: 'Annual Leave' },
    update: {},
    create: {
      name: 'Annual Leave',
      description: 'Standard paid time off',
      accrualRate: 1.5,
      accrualPeriod: 'MONTHLY',
      requiresApproval: true,
      maxCarryOver: 30, // HR Policy: Max 30 days carry-over
    }
  })

  const sickLeave = await prisma.leaveType.upsert({
    where: { name: 'Sick Leave' },
    update: {},
    create: {
      name: 'Sick Leave',
      description: 'Medical and health related leaves',
      accrualRate: 12,
      accrualPeriod: 'YEARLY',
      requiresApproval: true,
      maxCarryOver: 0, // HR Policy: No carry-over
    }
  })

  const casualLeave = await prisma.leaveType.upsert({
    where: { name: 'Casual Leave' },
    update: {},
    create: {
      name: 'Casual Leave',
      description: 'Urgent unplanned personal reasons',
      accrualRate: 6,
      accrualPeriod: 'YEARLY',
      requiresApproval: true,
      maxCarryOver: 0, // HR Policy: No carry-over
    }
  })

  // System Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kaprahrms.com' },
    update: {},
    create: {
      email: 'admin@kaprahrms.com',
      passwordHash,
      role: 'ADMIN',
      employee: {
        create: {
          employeeId: 'EMP-001',
          firstName: 'System',
          lastName: 'Admin',
          hireDate: new Date(),
          jobTitle: 'System Administrator',
          employmentType: 'FULL_TIME',
          leaveBalances: {
            create: [
              { leaveTypeId: annualLeave.id, balance: 18 },
              { leaveTypeId: sickLeave.id, balance: 12 },
              { leaveTypeId: casualLeave.id, balance: 6 },
            ]
          },
          goals: {
            create: [
              {
                title: 'Launch HRMS Phase 3',
                description: 'Deploy performance management features.',
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
                status: 'IN_PROGRESS'
              }
            ]
          }
        }
      }
    },
  })

  // Standard Employee
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@kaprahrms.com' },
    update: {},
    create: {
      email: 'employee@kaprahrms.com',
      passwordHash,
      role: 'EMPLOYEE',
      employee: {
        create: {
          employeeId: 'EMP-002',
          firstName: 'John',
          lastName: 'Doe',
          hireDate: new Date(),
          jobTitle: 'Software Engineer',
          employmentType: 'FULL_TIME',
          leaveBalances: {
            create: [
              { leaveTypeId: annualLeave.id, balance: 18 },
              { leaveTypeId: sickLeave.id, balance: 12 },
              { leaveTypeId: casualLeave.id, balance: 6 },
            ]
          },
          goals: {
            create: [
              {
                title: 'Complete Next.js Training',
                description: 'Finish the advanced Next.js course.',
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: 'NOT_STARTED'
              },
              {
                title: 'Refactor Core Components',
                description: 'Improve performance of table components.',
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                status: 'IN_PROGRESS'
              }
            ]
          }
        }
      }
    },
  })

  // Set Manager-Employee relationship and add a performance review
  const adminEmp = await prisma.employee.findUnique({ where: { employeeId: 'EMP-001' } })
  const normalEmp = await prisma.employee.findUnique({ where: { employeeId: 'EMP-002' } })

  if (adminEmp && normalEmp) {
    await prisma.employee.update({
      where: { id: normalEmp.id },
      data: { managerId: adminEmp.id }
    })

    await prisma.performanceReview.upsert({
      where: {
        revieweeId_period: {
          revieweeId: normalEmp.id,
          period: '2025 Annual Review'
        }
      },
      update: {},
      create: {
        revieweeId: normalEmp.id,
        reviewerId: adminEmp.id,
        period: '2025 Annual Review',
        rating: 4,
        comments: 'John has performed exceptionally well this year, especially taking initiative on the frontend architecture.',
        status: 'SUBMITTED'
      }
    })
  }

  console.log('Seed data generated successfully!')
  console.log('Admin:', adminUser.email, '(password: password123)')
  console.log('Employee:', empUser.email, '(password: password123)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
