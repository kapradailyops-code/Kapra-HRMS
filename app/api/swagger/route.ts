export const dynamic = 'force-dynamic';
import { getApiDocs } from '../../../lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const spec = await getApiDocs();
        return NextResponse.json(spec);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

