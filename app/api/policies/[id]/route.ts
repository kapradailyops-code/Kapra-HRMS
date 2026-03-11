import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

async function requireAdmin() {
    const session = await auth();
    const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session?.user?.role || '');
    if (!isAdmin) return null;
    return session;
}

export async function GET(_: Request, props: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await props.params;
        const policy = await prisma.hRPolicy.findUnique({ where: { id } });
        if (!policy) return new NextResponse("Not found", { status: 404 });

        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');
        if (!policy.isPublished && !isAdmin) return new NextResponse("Forbidden", { status: 403 });

        return NextResponse.json(policy);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(request: Request, props: any) {
    try {
        const session = await requireAdmin();
        if (!session) return new NextResponse("Forbidden", { status: 403 });
        const { id } = await props.params;
        const body = await request.json();
        const { title, category, content, summary, isPublished, version, effectiveDate } = body;
        const policy = await prisma.hRPolicy.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(category && { category }),
                ...(content && { content }),
                summary: summary ?? undefined,
                version: version ?? undefined,
                isPublished: typeof isPublished === 'boolean' ? isPublished : undefined,
                effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
            }
        });
        return NextResponse.json(policy);
    } catch (error) {
        console.error("[POLICY_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(_: Request, props: any) {
    try {
        const session = await requireAdmin();
        if (!session) return new NextResponse("Forbidden", { status: 403 });
        const { id } = await props.params;
        await prisma.hRPolicy.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[POLICY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
