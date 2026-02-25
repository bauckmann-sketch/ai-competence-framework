'use client';

import { ResultsDashboard } from '@/components/results-dashboard';
import { CalculationResult } from '@/types';

interface SharedResultsProps {
    result: CalculationResult;
    aggregates: any;
}

export function SharedResultsView({ result, aggregates }: SharedResultsProps) {
    return (
        <ResultsDashboard
            result={result}
            aggregates={aggregates}
            onReset={() => {
                // In shared view, "reset" navigates to the home page to start a new survey
                window.location.href = '/';
            }}
        />
    );
}
