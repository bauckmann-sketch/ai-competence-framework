'use client';

import React, { useState, useMemo } from 'react';
import { CalculationResult, AggregateStats } from '@/types';
import { ResultsDashboard } from '@/components/results-dashboard';

/**
 * Distributes a total score across 5 areas (A-E) with some randomness.
 * Each area is 0-20, total is 0-100.
 */
function generateAreaScores(totalPercent: number): Record<string, { raw: number; max: number; percent: number }> {
    const areas = ['A', 'B', 'C', 'D', 'E'];
    const totalPoints = Math.round(totalPercent); // 0-100, sum of 5 areas each 0-20
    
    // Generate random weights and distribute points
    let weights = areas.map(() => Math.random() + 0.3);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / weightSum);
    
    let rawValues = weights.map(w => Math.round(w * totalPoints));
    
    // Clamp to 0-20
    rawValues = rawValues.map(v => Math.max(0, Math.min(20, v)));
    
    // Adjust to match total
    let currentSum = rawValues.reduce((a, b) => a + b, 0);
    let diff = totalPoints - currentSum;
    let attempts = 0;
    while (diff !== 0 && attempts < 50) {
        const idx = Math.floor(Math.random() * areas.length);
        if (diff > 0 && rawValues[idx] < 20) {
            rawValues[idx]++;
            diff--;
        } else if (diff < 0 && rawValues[idx] > 0) {
            rawValues[idx]--;
            diff++;
        }
        attempts++;
    }

    const scores: Record<string, { raw: number; max: number; percent: number }> = {};
    areas.forEach((area, i) => {
        scores[area] = {
            raw: rawValues[i],
            max: 20,
            percent: Math.round((rawValues[i] / 20) * 100),
        };
    });
    return scores;
}

function determineLevel(totalPercent: number): string {
    if (totalPercent <= 20) return 'Explorer';
    if (totalPercent <= 40) return 'User';
    if (totalPercent <= 60) return 'Power User';
    if (totalPercent <= 80) return 'Builder';
    return 'Architect';
}

/** Generate plausible fake answers for profiling questions */
function generateFakeAnswers(): Record<string, any> {
    return {
        Q0_1: ['admin', 'mkt', 'sales', 'hr', 'mgmt', 'analytics', 'it'][Math.floor(Math.random() * 7)],
        Q0_2: ['save_time', 'better_text', 'analysis'].slice(0, 3),
        Q1_2: ['never', 'lt_weekly', 'weekly', 'almost_daily', 'multi_daily'][Math.floor(Math.random() * 5)],
        Q1_2b: ['0', '1', '2_3', 'up_to_6'][Math.floor(Math.random() * 4)],
        Q1_3: ['chatbots', 'presentations', 'images'].slice(0, 3),
        QA2: 'clarify_context',
        QB2: ['context', 'audience', 'tone'],
        QC2: 'multi_sources',
        QD3: 'reorganize',
        QE2: 'assistant',
        QX3: 'time',
    };
}

export default function ZaverTestPage() {
    const [inputPercent, setInputPercent] = useState(65);
    const [seed, setSeed] = useState(0); // to trigger re-randomization

    const result: CalculationResult = useMemo(() => {
        // Use seed to re-randomize area distribution
        const _seed = seed; // just to make useMemo aware of it
        void _seed;
        
        const areaScores = generateAreaScores(inputPercent);
        const totalScore = Object.values(areaScores).reduce((sum, s) => sum + s.raw, 0);
        const totalPercent = totalScore; // total is already 0-100

        return {
            totalScore,
            totalPercent,
            level: determineLevel(totalPercent),
            areaScores,
            brakeApplied: false,
            answers: generateFakeAnswers(),
            version: 'v13',
        };
    }, [inputPercent, seed]);

    // Fake aggregates for community comparison
    const fakeAggregates: AggregateStats = useMemo(() => ({
        count: 347,
        avgTotalScore: 48,
        avgAreaScores: { A: 11, B: 9, C: 10, D: 8, E: 7 },
        levelDistribution: { Explorer: 45, User: 120, 'Power User': 95, Builder: 60, Architect: 27 },
        questionDistributions: {
            Q0_2: { save_time: 280, better_text: 210, analysis: 150, content: 120, automation: 90, learning: 75 },
            Q1_2b: { '0': 80, '1': 120, '2_3': 90, 'up_to_6': 40, 'up_to_10': 12, 'gt_10': 5 },
            QB2: { context: 250, audience: 180, tone: 150, format: 200, quality_criteria: 100, example: 80, none: 20 },
            Q1_3: { chatbots: 300, presentations: 120, images: 180, video: 90, meeting_notes: 60, ide_tools: 40, voice: 30 },
        },
    }), []);

    return (
        <div className="min-h-screen bg-background">
            {/* Test controls bar */}
            <div className="sticky top-0 z-[60] bg-yellow-50 border-b-2 border-yellow-300 px-6 py-4 shadow-md">
                <div className="container max-w-6xl mx-auto flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-yellow-700">⚠️ TEST</span>
                        <span className="text-sm font-bold text-yellow-800">/zaver-test</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-yellow-800">Celkové skóre:</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={inputPercent}
                            onChange={e => setInputPercent(Number(e.target.value))}
                            className="w-48 accent-yellow-600"
                        />
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={inputPercent}
                            onChange={e => setInputPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                            className="w-16 border-2 border-yellow-300 rounded-lg px-2 py-1 text-center font-black text-yellow-800 bg-white"
                        />
                        <span className="text-yellow-700 font-bold">%</span>
                    </div>
                    
                    <button
                        onClick={() => setSeed(s => s + 1)}
                        className="px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
                    >
                        🔄 Přerozdělit oblasti
                    </button>

                    <div className="flex items-center gap-2 text-xs text-yellow-600">
                        <span className="font-bold">Level: {result.level}</span>
                        <span>|</span>
                        {Object.entries(result.areaScores).map(([area, s]) => (
                            <span key={area} className="font-mono">{area}:{s.raw}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results dashboard with test data */}
            <ResultsDashboard
                result={result}
                aggregates={fakeAggregates}
                onReset={() => {}}
            />
        </div>
    );
}
