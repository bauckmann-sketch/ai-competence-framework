import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? `set (${process.env.AIRTABLE_API_KEY.slice(0, 8)}...)` : 'MISSING',
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? `set (${process.env.AIRTABLE_BASE_ID})` : 'MISSING',
        AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME || '(not set, using default: Submissions)',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? `set (${process.env.RESEND_API_KEY.slice(0, 8)}...)` : 'MISSING',
        RESEND_TO_OVERRIDE: process.env.RESEND_TO_OVERRIDE || '(not set)',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || '(not set, using default)',
        NODE_ENV: process.env.NODE_ENV,
    });
}
