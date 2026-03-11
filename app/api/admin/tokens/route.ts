import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        const tokens = await prisma.apiToken.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tokens);
    } catch (error) {
        console.error("[API_TOKENS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        const { name } = await request.json();
        if (!name) return new NextResponse("Name is required", { status: 400 });

        // Generate a secure API token
        const rawToken = `sk_${uuidv4().replace(/-/g, '')}`;

        const token = await prisma.apiToken.create({
            data: {
                name,
                token: rawToken,
                scopes: "read:employees" // Default scope
            }
        });

        return NextResponse.json(token, { status: 201 });
    } catch (error) {
        console.error("[API_TOKENS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
