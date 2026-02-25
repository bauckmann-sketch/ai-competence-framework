// Fitness Report v2 - Updated with 6 muscle groups
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Anchor, Dumbbell, ShieldCheck, Activity, Settings, Palette, Zap, Target } from 'lucide-react';
import { CalculationResult } from '@/types';

interface FitnessReportProps {
    result: CalculationResult;
}

export const FitnessReport: React.FC<FitnessReportProps> = ({ result }) => {
    const { level, totalPercent, areaScores } = result;

    // Fitness Personas based on Level
    const getPersona = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('architect')) return {
            title: "AI Terminátor / Kulturista",
            desc: "Tvůj AI benchmark je v oblasti absolutní špičky. Ovládáš nástroje jako profík a tvůj digitální svalový růst už v podstatě nemá kam jít. Jsi připraven na olympiádu!",
            image: "/images/personas/architect.jpg",
            status: "Max Power Mode"
        };
        if (l.includes('power user')) return {
            title: "AI Gym Rat / Nadšenec",
            desc: "V digitální posilovně jsi pečený vařený. Používáš AI efektivně, máš skvělou techniku, ale pár sérií k dokonalosti ti ještě chybí. Tvůj objem je působivý!",
            image: "/images/personas/gym-rat.jpg",
            status: "V objemu"
        };
        if (l.includes('user')) return {
            title: "AI Víkendový Jogger",
            desc: "AI občas provětráš, ale většinou jen tak na kochačku. Máš dobrou základní fyzičku, ale pro skutečný digitální svalový nárůst by to chtělo přidat na intenzitě transformace.",
            image: "/images/personas/jogger.jpg",
            status: "Rekreační režim"
        };
        return {
            title: "AI Gaučový povaleč",
            desc: "Zatím jen pozoruješ ty fit lidi z dálky. Nevadí! Každý velký sval začal jako sen. Dneska je tvůj první den v posilovně, tak pojďme zvednout první prompt!",
            image: "/images/personas/couch-potato.jpg",
            status: "Zahřívání"
        };
    };

    const persona = getPersona(level);

    // Mapping skill areas to "Muscle Groups" A-F
    const muscleGroups = [
        { id: 'A', name: 'Základy & Core', score: areaScores['A']?.percent || 0, icon: <Anchor className="w-4 h-4" /> },
        { id: 'B', name: 'Bicepsy (Síla zadání)', score: areaScores['B']?.percent || 0, icon: <Dumbbell className="w-4 h-4" /> },
        { id: 'C', name: 'Balanční cvičení (Stabilita)', score: areaScores['C']?.percent || 0, icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'D', name: 'Kardio (Denní rutina)', score: areaScores['D']?.percent || 0, icon: <Activity className="w-4 h-4" /> },
        { id: 'E', name: 'Výdrž (Systémy a opakovatelnost)', score: areaScores['E']?.percent || 0, icon: <Settings className="w-4 h-4" /> },
        { id: 'F', name: 'Mobilita (Kreativní rozsah)', score: areaScores['F']?.percent || 0, icon: <Palette className="w-4 h-4" /> },
    ];

    return (
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden mb-12 bg-white">
            <div className="bg-slate-950 p-6 md:p-10 relative overflow-hidden">
                {/* Decorative background elements for Dark UI feel */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="flex-shrink-0 relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden bg-slate-900">
                            <img
                                src={persona.image}
                                alt={persona.title}
                                className="w-full h-full object-cover opacity-90"
                            />
                        </div>
                        <div className="absolute -bottom-2 right-4 bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg z-10 uppercase tracking-wider">
                            {persona.status}
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-4 flex-grow">
                        <div className="inline-block bg-primary/20 text-primary border border-primary/30 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">
                            AI Fitness Profil
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                            {persona.title}
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed font-medium">
                            {persona.desc}
                        </p>
                    </div>

                    <div className="flex-shrink-0 bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[180px]">
                        <span className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(221,60,32,0.4)]">{totalPercent}%</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Max Power</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-10">
                    <div className="h-px bg-slate-100 flex-grow" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Tréninkový plán svalových skupin</h3>
                    <div className="h-px bg-slate-100 flex-grow" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    {muscleGroups.map((group) => (
                        <div key={group.id} className="space-y-4 group">
                            <div className="flex justify-between items-end">
                                <span className="flex items-center gap-3 font-black text-slate-800 text-sm">
                                    <span className="bg-slate-950 p-2 rounded-xl text-primary shadow-lg group-hover:scale-110 transition-transform">
                                        {group.icon}
                                    </span>
                                    {group.name}
                                </span>
                                <span className="text-sm font-black text-primary mb-1">
                                    {group.score}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(221,60,32,0.2)]"
                                    style={{ width: `${group.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

    );
};
