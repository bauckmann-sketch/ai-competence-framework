import { NextResponse } from 'next/server';
import { getAggregates } from '@/lib/persistence';

export async function GET() {
    try {
        const aggregates = await getAggregates();
        return NextResponse.json(aggregates);
    } catch (error) {
        console.error('Averages fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
