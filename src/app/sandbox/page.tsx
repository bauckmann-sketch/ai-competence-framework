'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import questionsV13 from '@/data/v13/questions.json';
import scoringV13 from '@/data/v13/scoring.json';
import { calculateScore } from '@/lib/scoring-engine';

type Question = (typeof questionsV13.questions)[number];

const AREA_COLORS: Record<string, string> = {
    A: '#DD3C20', B: '#f97316', C: '#eab308',
    D: '#22c55e', E: '#3b82f6', F: '#8b5cf6',
};

// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionRow({ q, value, onChange }: { q: Question; value: any; onChange: (id: string, val: any) => void }) {
    const options = (q as any).options ?? [];
    const maxSelect = (q as any).max_select ?? 99;

    if (q.type === 'single_choice') {
        return (
            <div className="flex flex-wrap gap-1.5">
                {options.map((o: any) => (
                    <button key={o.value} onClick={() => onChange(q.id, o.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${value === o.value ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50 bg-white'}`}>
                        {o.label}
                    </button>
                ))}
            </div>
        );
    }

    if (q.type === 'multi_select') {
        const selected: string[] = Array.isArray(value) ? value : [];
        const exclusive = (q as any).ui?.exclusive_options ?? [];
        const toggle = (v: string) => {
            if (exclusive.includes(v)) { onChange(q.id, selected.includes(v) ? [] : [v]); return; }
            const filtered = selected.filter(x => !exclusive.includes(x));
            if (filtered.includes(v)) onChange(q.id, filtered.filter(x => x !== v));
            else if (filtered.length < maxSelect) onChange(q.id, [...filtered, v]);
        };
        return (
            <div className="flex flex-wrap gap-1.5">
                {options.map((o: any) => {
                    const active = selected.includes(o.value);
                    const disabled = !active && selected.length >= maxSelect && !exclusive.includes(o.value);
                    return (
                        <button key={o.value} onClick={() => toggle(o.value)} disabled={disabled}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-primary text-white border-primary'
                                : disabled ? 'border-slate-100 text-slate-300 bg-white cursor-not-allowed'
                                    : 'border-slate-200 text-slate-600 hover:border-primary/50 bg-white'}`}>
                            {o.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (q.type === 'email_optional') {
        return (
            <input type="email" value={value ?? ''} onChange={e => onChange(q.id, e.target.value)}
                placeholder="(volitelné)" className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 w-64 focus:outline-none focus:border-primary" />
        );
    }

    return <span className="text-xs text-slate-400 italic">Typ {q.type}</span>;
}

// ─── Animated score number ─────────────────────────────────────────────────────
function ScoreDisplay({ value }: { value: number | null }) {
    const [flash, setFlash] = useState(false);
    const prev = useRef<number | null>(null);

    useEffect(() => {
        if (prev.current !== value) {
            prev.current = value;
            setFlash(true);
            const t = setTimeout(() => setFlash(false), 600);
            return () => clearTimeout(t);
        }
    }, [value]);

    return (
        <div className={`text-5xl font-black transition-all duration-300 ${flash ? 'text-green-400 scale-110' : 'text-primary'}`}>
            {value ?? '—'}%
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SandboxPage() {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const onChange = (id: string, val: any) => setAnswers(prev => ({ ...prev, [id]: val }));

    const result = useMemo(() => {
        try { return calculateScore(answers, scoringV13 as any); }
        catch { return null; }
    }, [answers]);

    const questions = questionsV13.questions;
    const sections = questionsV13.sections;

    // Scored question IDs from scoring config
    const scoredQIds = new Set(
        Object.values((scoringV13 as any).area_questions ?? {}).flatMap((aq: any) => [
            ...(aq.scale ?? []),
            ...(aq.behavior ?? []),
        ])
    );
    // v13: areas A-E only
    const activeAreas = ['A', 'B', 'C', 'D', 'E'];

    const answeredCount = questions.filter(q => {
        const v = answers[q.id];
        return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
    }).length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Sandbox</span>
                    <span className="text-sm font-bold text-slate-700">AI Competence Framework v13 — interaktivní tester</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{answeredCount} / {questions.length} otázek vyplněno</span>
                    <button onClick={() => setAnswers({})} className="text-primary hover:text-primary/70 font-bold transition-colors">Resetovat vše</button>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-6 text-xs text-amber-800">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" /> Otázky se <strong>počítají</strong> do skóre</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" /> Otázky se <strong>nepočítají</strong> (kontext/klasifikace)</span>
                <span className="ml-auto italic">Skóre se změní pouze u barevně označených sekcí SA–SE</span>
            </div>

            <div className="flex h-[calc(100vh-86px)]">
                {/* ── LEFT ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {sections.map(section => {
                        const sectionQs = questions.filter(q => q.section === section.id);
                        if (sectionQs.length === 0) return null;
                        const scored = (section as any).scored;
                        const area = (section as any).area;
                        const areaColor = area ? AREA_COLORS[area] : undefined;

                        return (
                            <div key={section.id} className="space-y-3">
                                {/* Section header */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{section.id}</span>
                                    <span className="text-sm font-black text-slate-700">{section.title}</span>
                                    {scored ? (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: areaColor }}>
                                            Oblast {area} · počítá se ✓
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                                            nepočítá se do skóre
                                        </span>
                                    )}
                                </div>

                                {sectionQs.map(q => {
                                    const answered = (() => {
                                        const v = answers[q.id]; return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
                                    })();
                                    const isScored = scoredQIds.has(q.id);

                                    return (
                                        <div key={q.id}
                                            className={`bg-white rounded-xl border-2 p-4 space-y-3 transition-all ${answered
                                                ? isScored ? 'border-primary/40 shadow-sm' : 'border-slate-200'
                                                : 'border-slate-100'}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{q.id}</span>
                                                    <p className="text-sm font-semibold text-slate-800 leading-snug">{q.text}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {isScored && (
                                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: areaColor ?? '#ccc' }} title="Tato otázka ovlivňuje skóre" />
                                                    )}
                                                    {answered && (
                                                        <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                                                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {(q as any).max_select && (
                                                <p className="text-[10px] text-slate-400">max {(q as any).max_select} výběry</p>
                                            )}
                                            <QuestionRow q={q} value={answers[q.id]} onChange={onChange} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* ── RIGHT ──────────────────────────────────────────────── */}
                <div className="w-72 shrink-0 border-l border-slate-200 bg-white overflow-y-auto px-5 py-5 space-y-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live výsledky</p>

                    {/* Total score */}
                    <div className="bg-slate-950 rounded-2xl p-5 text-center">
                        <ScoreDisplay value={result?.totalPercent ?? null} />
                        <div className="text-white font-black text-lg mt-1">{result?.level ?? '—'}</div>
                        <div className="text-slate-500 text-xs mt-1">Celkové skóre · {result?.totalScore ?? 0} bodů</div>
                    </div>

                    {/* Radar chart */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radar graf</p>
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={activeAreas.map(area => ({
                                    subject: area,
                                    user: result?.areaScores?.[area]?.raw ?? 0,
                                    fullMark: 20,
                                }))}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} />
                                    <Radar name="Skóre" dataKey="user" stroke="#DD3C20" fill="#DD3C20" fillOpacity={0.35} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Area scores */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Oblasti A–E</p>
                        {activeAreas.map(area => {
                            const data = result?.areaScores?.[area];
                            const p = data ? Math.round((data.raw / data.max) * 100) : 0;
                            const color = AREA_COLORS[area];
                            return (
                                <div key={area} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-700">{area}</span>
                                        <span className="font-black tabular-nums" style={{ color }}>{data?.raw ?? 0}/{data?.max ?? 20} ({p}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Brake */}
                    {result?.brakeApplied && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs">
                            <p className="font-black text-orange-700">⚠️ Brzda aktivní</p>
                            <p className="text-orange-600 mt-0.5">{result.brakeExplanationKey}</p>
                        </div>
                    )}

                    {/* JSON */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Surové odpovědi</p>
                        <pre className="text-[10px] bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-64 text-slate-600 leading-relaxed">
                            {JSON.stringify(answers, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
