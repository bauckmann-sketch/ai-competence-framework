import { sendResultsEmail } from '../src/lib/email';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log('--- Resend Email Diagnostic ---');
    console.log('Checking environment variables...');

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';
    const testTo = process.argv[2] || 'david@bauckmann.cz'; // Default test email

    if (!apiKey) {
        console.error('❌ Error: RESEND_API_KEY is not set in .env.local');
        return;
    }

    console.log('✅ API Key found (starts with:', apiKey.substring(0, 7) + '...)');
    console.log('✅ From email:', fromEmail);
    console.log('✅ To email:', testTo);

    const mockResult: any = {
        totalPercent: 75,
        level: 'Power User',
        areaScores: {
            'A': { percent: 80 },
            'B': { percent: 70 },
            'C': { percent: 90 },
            'D': { percent: 60 },
            'E': { percent: 50 },
            'F': { percent: 75 }
        }
    };

    console.log('\nSending test email...');
    try {
        await sendResultsEmail(testTo, mockResult, 'test-record-id');
        console.log('\n✅ Diagnostic finished. Check console for Resend response log.');
        console.log('Note: If using onboarding@resend.dev, you can only send to your own email used to sign up for Resend.');
    } catch (err) {
        console.error('❌ Diagnostic failed:', err);
    }
}

test();
