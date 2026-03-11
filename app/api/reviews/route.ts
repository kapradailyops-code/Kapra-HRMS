import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

// GET /api/reviews – get reviews (for the current user or their reports)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(request.url);
        const revieweeId = searchParams.get("revieweeId");
        const reviewerId = searchParams.get("reviewerId");
        const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session.user?.role || '');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user?.employee) return NextResponse.json([]);

        // Admins can filter all reviews by reviewee or reviewer
        if (isAdmin) {
            const reviews = await prisma.performanceReview.findMany({
                where: {
                    ...(revieweeId ? { revieweeId } : {}),
                    ...(reviewerId ? { reviewerId } : {})
                },
                include: {
                    reviewee: { select: { firstName: true, lastName: true, jobTitle: true } },
                    reviewer: { select: { firstName: true, lastName: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(reviews);
        }

        // Regular users: see reviews written about them or by them
        const reviews = await prisma.performanceReview.findMany({
            where: {
                OR: [
                    { revieweeId: user.employee.id },
                    { reviewerId: user.employee.id }
                ]
            },
            include: {
                reviewee: { select: { firstName: true, lastName: true, jobTitle: true } },
                reviewer: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error("[REVIEWS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/reviews – create or submit a review (for managers)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });
        if (!user?.employee) return new NextResponse("Employee not found", { status: 404 });

        const { revieweeId, period, rating, comments, status } = await request.json();
        if (!revieweeId || !period) return new NextResponse("revieweeId and period are required", { status: 400 });

        const review = await prisma.performanceReview.upsert({
            where: { revieweeId_period: { revieweeId, period } },
            update: { rating, comments, status },
            create: {
                revieweeId,
                reviewerId: user.employee.id,
                period,
                rating,
                comments,
                status: status || 'DRAFT'
            }
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error("[REVIEWS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
