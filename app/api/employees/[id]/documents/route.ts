import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
    request: Request,
    { params }: any
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const documents = await prisma.document.findMany({
            where: { employeeId: id },
            orderBy: { uploadedAt: "desc" }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("[DOCUMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const documentType = formData.get("documentType") as string;

        if (!file || !documentType) {
            return new NextResponse("Missing file or documentType", { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        // Sanitize filename and make unique
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        const documentUrl = `/uploads/${fileName}`;

        const document = await prisma.document.create({
            data: {
                employeeId: id,
                title: file.name,
                documentUrl,
                documentType
            }
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
