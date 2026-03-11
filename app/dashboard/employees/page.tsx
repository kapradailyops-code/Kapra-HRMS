import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import EmployeeTable from "./EmployeeTable";

export default async function EmployeesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const employees = await prisma.employee.findMany({
    include: {
      user: { select: { email: true, role: true } },
      department: { select: { name: true } },
      manager: { select: { firstName: true, lastName: true } },
    },
    orderBy: { firstName: "asc" },
  });

  // Unique department names for filter dropdown
  const departments = [...new Set(employees.map(e => e.department?.name).filter(Boolean))] as string[];

  const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

  return (
    <EmployeeTable
      employees={employees as any}
      isAdmin={isAdmin}
      departments={departments}
    />
  );
}
