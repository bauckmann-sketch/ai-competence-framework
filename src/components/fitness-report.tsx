// Fitness Report — simplified for v13 (no archetype names, A-E areas)
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Anchor, Dumbbell, ShieldCheck, Activity, Settings, Palette } from 'lucide-react';
import { CalculationResult } from '@/types';

interface FitnessReportProps {
    result: CalculationResult;
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

const LEVEL_STATUS: Record<string, string> = {
    explorer: 'Začínáte',
    user: 'Rekreační provoz',
    'power user': 'V provozu',
    builder: 'Ve výstavbě',
    architect: 'Orchestrátor',
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

export const FitnessReport: React.FC<FitnessReportProps> = ({ result }) => {
    const { level, totalPercent, areaScores, version } = result;

    const isV13 = version === 'v13';
    const activeGroups = isV13
        ? ALL_MUSCLE_GROUPS.filter(g => g.id !== 'F')
        : ALL_MUSCLE_GROUPS;

    const l = (level ?? '').toLowerCase().trim();
    const bg = LEVEL_BG[l] ?? 'from-slate-800 to-slate-900';
    const status = LEVEL_STATUS[l] ?? 'Vyhodnoceno';
    const personaImage = LEVEL_IMAGE[l] ?? null;

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
                        <p className="text-white/60 text-sm font-medium">{status}</p>
                    </div>

                    <div className="flex-shrink-0 bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[180px]">
                        <span className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(221,60,32,0.4)]">{totalPercent}%</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Celkové skóre</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-10">
                    <div className="h-px bg-slate-100 flex-grow" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
                        Kompetenční oblasti
                    </h3>
                    <div className="h-px bg-slate-100 flex-grow" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    {activeGroups.map((group) => {
                        const score = areaScores[group.id]?.percent || 0;
                        return (
                            <div key={group.id} className="space-y-4 group">
                                <div className="flex justify-between items-end">
                                    <span className="flex items-center gap-3 font-black text-slate-800 text-sm">
                                        <span className="bg-slate-950 p-2 rounded-xl text-primary shadow-lg group-hover:scale-110 transition-transform">
                                            {group.icon}
                                        </span>
                                        {group.name}
                                    </span>
                                    <span className="text-sm font-black text-primary mb-1">{score}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(221,60,32,0.2)]"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
