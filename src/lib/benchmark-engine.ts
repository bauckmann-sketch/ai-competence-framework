import { MarketBenchmark, AggregateStats } from '../types';

export interface ComparisonPoint {
    label: string;
    userValue: any;
    marketPercent: number | null;
    internalPercent: number | null;
}

export function calculateMarketComparison(
    userAnswers: Record<string, any>,
    marketBenchmark: MarketBenchmark,
    internalAggregates: AggregateStats
): Record<string, ComparisonPoint[]> {
    const results: Record<string, ComparisonPoint[]> = {};

    for (const [key, benchmark] of Object.entries(marketBenchmark.benchmarks)) {
        const qId = benchmark.question_id;
        const userVal = userAnswers[qId];

        const comparisonPoints: ComparisonPoint[] = [];

        // For profiling questions, we usually want to compare the distribution
        // Internal aggregate distributions (counts)
        const internalDist = (internalAggregates.questionDistributions?.[qId] || {}) as Record<string, number>;
        const totalInternal = Object.values(internalDist).reduce((sum: number, count: number) => sum + count, 0);

        for (const [optionValue, marketPct] of Object.entries(benchmark.values)) {
            const internalCount = internalDist[optionValue] || 0;
            const internalPct = totalInternal > 0 ? (internalCount / totalInternal) * 100 : 0;

            comparisonPoints.push({
                label: optionValue,
                userValue: Array.isArray(userVal) ? userVal.includes(optionValue) : userVal === optionValue,
                marketPercent: marketPct as number | null,
                internalPercent: Math.round(internalPct)
            });
        }

        results[qId] = comparisonPoints;
    }

    return results;
}
