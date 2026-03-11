import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// Simple Rate Limiting (In-memory for prototype, normally Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests / minute

function checkRateLimit(token: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(token);

    if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(token, { count: 1, lastReset: now });
        return true;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    record.count += 1;
    return true;
}


/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: Retrieve a list of employees
 *     description: Returns a sanitized list of employees. Highly sensitive details like salaries are omitted.
 *     tags:
 *       - Developer API
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional ID to filter employees by department.
 *     responses:
 *       200:
 *         description: A summarized list of existing employees.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized. Missing or invalid Bearer token.
 *       429:
 *         description: Rate Limit Exceeded. Default is 60 requests per minute.
 */
// GET /api/v1/employees - Fetch employee directory via API token
export async function GET(request: Request) {
    try {
        // 1. Authenticate via Bearer Token
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new NextResponse("Missing or Invalid Authorization Header", { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // 2. Rate Limiting Check
        if (!checkRateLimit(token)) {
            return new NextResponse("Rate Limit Exceeded", { status: 429 });
        }

        // 3. Verify Token
        const apiToken = await prisma.apiToken.findUnique({
            where: { token }
        });

        if (!apiToken) {
            return new NextResponse("Invalid Token", { status: 401 });
        }

        if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
            return new NextResponse("Token Expired", { status: 401 });
        }

        // Check exact scope (ensure token isn't overly permissive if restricted)
        if (!apiToken.scopes.includes("read:employees") && apiToken.scopes !== "*") {
            return new NextResponse("Insufficient Scopes", { status: 403 });
        }

        // 4. Fetch and Sanitize Data
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId");

        const employees = await prisma.employee.findMany({
            where: departmentId ? { departmentId } : {},
            include: {
                department: { select: { name: true } }
            }
        });

        // Strip out highly sensitive details
        const sanitizedEmployees = employees.map(emp => ({
            id: emp.id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            jobTitle: emp.jobTitle,
            department: emp.department?.name,
            status: emp.status,
            workLocation: emp.workLocation
        }));

        return NextResponse.json({
            count: sanitizedEmployees.length,
            data: sanitizedEmployees
        });

    } catch (error) {
        console.error("[DEV_API_EMPLOYEES_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
