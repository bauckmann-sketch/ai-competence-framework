// Fitness Report — simplified for v13 (no archetype names, A-E areas)
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Anchor, Dumbbell, ShieldCheck, Activity, Settings, Palette } from 'lucide-react';
import { CalculationResult } from '@/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import copyData from '@/data/v10/copy.json';
import type { AggregateStats } from '@/types';

interface FitnessReportProps {
    result: CalculationResult;
    aggregates?: AggregateStats | null;
}

const LEVEL_BG: Record<string, string> = {
    explorer: 'from-slate-800 to-slate-900',
    user: 'from-blue-900 to-slate-900',
    'power user': 'from-indigo-900 to-slate-900',
    builder: 'from-orange-900 to-slate-900',
    architect: 'from-red-900 to-slate-900',
};

const LEVEL_IMAGE: Record<string, string> = {
    explorer: '/images/personas/couch-potato.jpg',
    user: '/images/personas/jogger.jpg',
    'power user': '/images/personas/gym-rat.jpg',
    builder: '/images/personas/builder.jpg',
    architect: '/images/personas/architect.jpg',
};

// Ordered muscle groups — F shown only for pre-v13 versions
const ALL_MUSCLE_GROUPS = [
    { id: 'A', name: 'Základy & orientace', icon: <Anchor className="w-4 h-4" /> },
    { id: 'B', name: 'Promptování & kontext', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'C', name: 'Ověřování & AI literacy', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'D', name: 'Workflow & produktivita', icon: <Activity className="w-4 h-4" /> },
    { id: 'E', name: 'Systémy & automatizace', icon: <Settings className="w-4 h-4" /> },
    { id: 'F', name: 'Tvorba & komunikace', icon: <Palette className="w-4 h-4" /> },
];

// Helper: find level copy from external data (case-insensitive)
function getLevelCopy(level: string): { tagline?: string; description?: string } {
    const lc = (copyData as any).level_copy ?? {};
    const key = Object.keys(lc).find(k => k.toLowerCase() === (level ?? '').toLowerCase().trim());
    return key ? lc[key] : {};
}

export const FitnessReport: React.FC<FitnessReportProps> = ({ result, aggregates }) => {
    const { level, totalPercent, areaScores, version } = result;

    const isV13 = version === 'v13';
    const activeGroups = isV13
        ? ALL_MUSCLE_GROUPS.filter(g => g.id !== 'F')
        : ALL_MUSCLE_GROUPS;

    const l = (level ?? '').toLowerCase().trim();
    const bg = LEVEL_BG[l] ?? 'from-slate-800 to-slate-900';
    const personaImage = LEVEL_IMAGE[l] ?? null;
    const { tagline } = getLevelCopy(level ?? '');

    return (
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden mb-12 bg-white">
            <div className={`bg-gradient-to-br ${bg} p-6 md:p-10 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Persona image */}
                    {personaImage && (
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl ring-4 ring-primary/30">
                                <img
                                    src={personaImage}
                                    alt={level}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <div className="text-center md:text-left space-y-4 flex-grow">
                        <div className="inline-block bg-primary/20 text-primary border border-primary/30 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">
                            AI Competence Report
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                            {level}
                        </h2>
                        {tagline && (
                            <p className="text-white/70 text-sm font-medium max-w-xs leading-relaxed">{tagline}</p>
                        )}
                    </div>

                    <div className="flex-shrink-0 bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[180px]">
                        <span className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(221,60,32,0.4)]">{totalPercent}%</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Celkové skóre</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-6 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-slate-100 flex-grow" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Kompetenční oblasti</h3>
                    <div className="h-px bg-slate-100 flex-grow" />
                </div>

                {/* 2-column: radar left, bars right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Radar chart */}
                    <div className="h-56 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={activeGroups.map(g => {
                                const avg = aggregates?.avgAreaScores?.[g.id] ?? 0;
                                const rawAvg = avg > 20 ? Math.round(avg * 20 / 100) : avg;
                                return {
                                    area: g.id,
                                    user: areaScores[g.id]?.raw ?? 0,
                                    avg: rawAvg,
                                    fullMark: 20,
                                };
                            })}>
                                <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                                <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                                <Radar name="Váš výsledek" dataKey="user" stroke="#DD3C20" fill="#DD3C20" fillOpacity={0.2} strokeWidth={2.5} dot={{ r: 3, fill: '#DD3C20' }} />
                                {aggregates && (
                                    <Radar name="Průměr komunity" dataKey="avg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.07} strokeWidth={1.5} strokeDasharray="4 3" />
                                )}
                            </RadarChart>
                        </ResponsiveContainer>
                        {aggregates && (
                            <p className="text-center text-[10px] text-slate-400 -mt-2">
                                <span className="inline-block w-3 h-0.5 bg-primary rounded mr-1 align-middle" />Váš výsledek
                                <span className="inline-block w-3 h-0.5 bg-slate-300 rounded mx-2 align-middle" />Průměr komunity
                            </p>
                        )}
                    </div>

                    {/* Progress bars */}
                    <div className="grid grid-cols-1 gap-5">
                        {activeGroups.map((group) => {
                            const score = areaScores[group.id]?.percent || 0;
                            return (
                                <div key={group.id} className="space-y-2 group">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-2 font-black text-slate-800 text-xs">
                                            <span className="bg-slate-950 p-1.5 rounded-lg text-primary shadow group-hover:scale-110 transition-transform">
                                                {group.icon}
                                            </span>
                                            {group.name}
                                        </span>
                                        <span className="text-xs font-black text-primary">{score}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-1000 ease-out rounded-full"
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
