export const dynamic = 'force-dynamic';
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

        const where: any = {};
        if (!isAdmin) where.isPublished = true; // employees only see published
        if (category) where.category = category;

        const policies = await prisma.hRPolicy.findMany({
            where,
            orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
            select: { id: true, title: true, category: true, summary: true, isPublished: true, version: true, effectiveDate: true, updatedAt: true }
        });

        return NextResponse.json(policies);
    } catch (error) {
        console.error("[POLICIES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session?.user?.role || '');
        if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

        const body = await request.json();
        const { title, category, content, summary, isPublished, version, effectiveDate } = body;
        if (!title || !category || !content) return new NextResponse("title, category, and content are required", { status: 400 });

        const policy = await prisma.hRPolicy.create({
            data: { title, category, content, summary, isPublished: isPublished ?? false, version, effectiveDate: effectiveDate ? new Date(effectiveDate) : null }
        });

        return NextResponse.json(policy, { status: 201 });
    } catch (error) {
        console.error("[POLICIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

