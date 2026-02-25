import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? `set (${process.env.AIRTABLE_API_KEY.slice(0, 8)}...)` : 'MISSING',
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? `set (${process.env.AIRTABLE_BASE_ID})` : 'MISSING',
        AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME || '(not set, using default: Submissions)',
        NODE_ENV: process.env.NODE_ENV,
    });
}
