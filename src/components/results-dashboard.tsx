'use client';

import React, { useMemo, useRef } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ComposedChart
} from 'recharts';
import { CalculationResult, AggregateStats, MarketBenchmark, CopyData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, Download, Mail, RefreshCw, Trophy, Users, BarChart3, Globe, ShieldAlert, Zap, Target, Share2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import copyDataV1 from '@/data/v1/copy.json';
import copyDataV3 from '@/data/v3/copy.json';
import copyDataV4 from '@/data/v4/copy.json';
import copyDataV6 from '@/data/v6/copy.json';
import copyDataV7 from '@/data/v7/copy.json';
import copyDataV9 from '@/data/v9/copy.json';
import copyDataV10 from '@/data/v10/copy.json';
import copyDataV11 from '@/data/v11/copy.json';
import copyDataV12 from '@/data/v12/copy.json';
import copyDataV13 from '@/data/v13/copy.json';
import marketBenchmarkV1 from '@/data/v1/market_benchmark.json';
import marketBenchmarkV3 from '@/data/v3/market_benchmark.json';
import marketBenchmarkV4 from '@/data/v4/market_benchmark.json';
import marketBenchmarkV6 from '@/data/v6/market_benchmark.json';
import marketBenchmarkV7 from '@/data/v7/market_benchmark.json';
import marketBenchmarkV9 from '@/data/v9/market_benchmark.json';
import marketBenchmarkV10 from '@/data/v10/market_benchmark.json';
import { calculateMarketComparison } from '@/lib/benchmark-engine';
import { cn } from '@/lib/utils';

import { FitnessReport } from './fitness-report';
import { CtaSection } from './cta-section';
import { CourseRecommendations } from './course-recommendations';

interface ResultsProps {
    result: CalculationResult;
    aggregates: AggregateStats | null;
    onReset: () => void;
}

const APP_URL = 'https://ai-competence-framework.vercel.app';

// ─── Social Share Bar ─────────────────────────────────────────────────────────
function SocialShareBar({ result }: { result: CalculationResult }) {
    const [copied, setCopied] = React.useState(false);

    const shareText = `Právě jsem zjistil/a svůj AI Index: ${result.totalPercent}% — úroveň ${result.level} 🎯\nZjistěte svůj osobní AI Index za 2 minuty zdarma:`;
    const shareUrl = APP_URL;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Můj AI Index', text: shareText, url: shareUrl });
            } catch { /* user cancelled */ }
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sdílet výsledek</p>
                <p className="text-sm font-bold text-slate-700 truncate mt-0.5">
                    {result.totalPercent}% · {result.level}
                </p>
            </div>
            <div className="flex gap-2 flex-wrap">
                {/* Native share (mobile) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl gap-1.5 text-xs">
                        <Share2 className="h-3.5 w-3.5" /> Sdílet
                    </Button>
                )}
                {/* Twitter/X */}
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.735-8.841L1.254 2.25H8.08l4.257 5.63 5.907-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        Twitter/X
                    </Button>
                </a>
                {/* LinkedIn */}
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        LinkedIn
                    </Button>
                </a>
                {/* Copy link */}
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl gap-1.5 text-xs">
                    <Link className="h-3.5 w-3.5" />
                    {copied ? 'Zkopírováno!' : 'Kopírovat link'}
                </Button>
                {/* Facebook */}
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        Facebook
                    </Button>
                </a>
                {/* Instagram — no web API, copies text */}
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl gap-1.5 text-xs" title="Instagram nemá web sdílení — zkopíruje link do schránky">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    Instagram
                </Button>
            </div>
        </div>
    );
}



export function ResultsDashboard({ result, aggregates, onReset }: ResultsProps) {
    const isV3 = result.version === 'v3';
    const isV4 = result.version === 'v4';
    const isV6 = result.version === 'v6';
    const isV7 = result.version === 'v7';
    const isV8 = result.version === 'v8';
    const isV9 = result.version === 'v9';
    const isV10 = result.version === 'v10';
    const isV11 = result.version === 'v11';
    const isV12 = result.version === 'v12';
    const isV13 = result.version === 'v13';

    // v13 has full copy.json (A-E areas), v11 uses v10 copy fallback
    const copyData = (isV13 ? copyDataV13 : (isV12 ? copyDataV12 : (isV11 || isV10 ? copyDataV10 : (isV9 ? copyDataV9 : (isV8 || isV7 ? copyDataV7 : (isV6 ? copyDataV6 : (isV4 ? copyDataV4 : (isV3 ? copyDataV3 : copyDataV1)))))))) as unknown as CopyData;
    const marketBenchmark = (isV13 || isV12 || isV11 || isV10 ? marketBenchmarkV10 : (isV9 ? marketBenchmarkV9 : (isV8 || isV7 ? marketBenchmarkV7 : (isV6 ? marketBenchmarkV6 : (isV4 ? marketBenchmarkV4 : (isV3 ? marketBenchmarkV3 : marketBenchmarkV1)))))) as unknown as MarketBenchmark;

    // v13 areas: A-E only (F removed)
    const activeAreas = (isV13) ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'F'];

    const marketComparison = useMemo(() => {
        if (!aggregates) return null;
        return calculateMarketComparison(result.answers, marketBenchmark, aggregates);
    }, [result.answers, aggregates, marketBenchmark]);

    // avgAreaScores is stored as raw points (0–20), same scale as user.raw.
    // Guard: if avg values look like percent (>20), convert them to raw points.
    const chartData = activeAreas.map((area) => {
        const data = result.areaScores[area] ?? { raw: 0, max: 20, percent: 0 };
        const rawAvg = aggregates?.avgAreaScores?.[area] || 0;
        const scaledAvg = rawAvg > 20 ? Math.round(rawAvg * 20 / 100) : rawAvg;
        return {
            subject: area,
            user: data.raw,
            avg: scaledAvg,
            fullMark: 20,
        };
    });

    const levelInfo = copyData.level_copy[result.level];

    // Barrier info for QX3
    const barrierValue = result.answers['QX3'];
    const barrierInfo = copyData.barrier_copy?.mapping?.[barrierValue];

    // Scroll progress for sticky header
    const [scrolled, setScrolled] = React.useState(false);
    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 200);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative min-h-screen bg-background text-foreground">
            {/* Sticky Header */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-border",
                scrolled ? "translate-y-0 opacity-100 py-3 bg-white/80" : "-translate-y-full opacity-0 py-0"
            )}>
                <div className="container max-w-6xl mx-auto flex justify-between items-center px-4">
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-xs font-black uppercase tracking-tighter">Report</span>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-primary font-black">{result.level}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Skóre</span>
                            <span className="text-xl font-black text-primary">{result.totalPercent}%</span>
                        </div>
                        <Button size="sm" onClick={onReset} variant="ghost" className="rounded-full h-8 w-8 p-0">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container max-w-6xl mx-auto py-12 px-4 space-y-16 animate-in fade-in duration-700">
                <FitnessReport result={result} aggregates={aggregates} />

                {/* Social Share buttons */}
                <SocialShareBar result={result} />

                {/* SECTION 1: Hero KPIs */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card border-border shadow-md hover:border-primary/30 transition-all relative overflow-hidden group border-2">
                        <CardHeader className="pb-2">
                            <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                                <Trophy className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Celkové skóre</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-foreground">{result.totalPercent}%</div>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${result.totalPercent}%` }} />
                            </div>
                        </CardContent>
                        <Zap className="absolute -bottom-4 -right-4 h-24 w-24 text-primary opacity-5 group-hover:opacity-10 transition-opacity rotate-12" />
                    </Card>

                    <Card className="bg-card border-border shadow-md hover:border-cyan-500/30 transition-all relative overflow-hidden group border-2">
                        <CardHeader className="pb-2">
                            <div className="bg-cyan-500/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                                <Target className="h-5 w-5 text-cyan-600" />
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-cyan-600">{result.level}</div>
                            <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-wider italic">Průběžně se zlepšujete</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-md hover:border-blue-500/30 transition-all relative overflow-hidden group border-2">
                        <CardHeader className="pb-2">
                            <div className="bg-blue-500/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Komunita (vzorek)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-foreground">{aggregates?.count || 1}</div>
                            <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-wider">Počet lidí v databázi pro srovnání</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-md hover:border-orange-500/30 transition-all relative overflow-hidden group border-2">
                        <CardHeader className="pb-2">
                            <div className="bg-orange-500/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                                <BarChart3 className="h-5 w-5 text-orange-600" />
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vs. Průměr</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-foreground">
                                {aggregates ? (result.totalPercent > aggregates.avgTotalScore ? `+${Math.round(result.totalPercent - aggregates.avgTotalScore)}` : Math.round(result.totalPercent - aggregates.avgTotalScore)) : '—'}
                                <span className="text-lg opacity-40 ml-1">bodů</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-wider">Oproti průměru komunity</p>
                        </CardContent>
                    </Card>
                </section>

                {/* SECTION 2: Kompetenční profil A-F (MOVED UP) */}
                <section className="space-y-12 pt-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Badge className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 rounded-full uppercase text-[10px] font-black tracking-widest ring-4 ring-primary/5 text-xs">
                            Klíčový výsledek
                        </Badge>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900">Kompetenční profil A–{activeAreas[activeAreas.length - 1]}</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Váš výsledek napříč {activeAreas.length} klíčovými oblastmi metodiky Inovatix.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="h-[500px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#00000010" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 13, fontWeight: '900' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 20]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Vaše skóre"
                                        dataKey="user"
                                        stroke="#DD3C20"
                                        fill="#DD3C20"
                                        fillOpacity={0.5}
                                    />
                                    {aggregates && (
                                        <Radar
                                            name="Průměr komunity"
                                            dataKey="avg"
                                            stroke="#0EA5E9"
                                            fill="#0EA5E9"
                                            fillOpacity={0.1}
                                        />
                                    )}
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', color: '#0F172A' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black mb-6 text-slate-800">Průvodce oblastmi</h3>
                            <Accordion type="single" collapsible className="w-full">
                                {Object.entries(result.areaScores).map(([area, data]) => {
                                    const areaCopy = copyData.area_copy[area];
                                    if (!areaCopy) return null;
                                    const scoreBand = areaCopy.score_bands.find(b => data.raw >= b.range[0] && data.raw <= b.range[1]);

                                    return (
                                        <AccordionItem key={area} value={area} className="border-border">
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex justify-between items-center w-full pr-4 text-left">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">{area}</div>
                                                        <span className="font-bold text-lg text-slate-700">{areaCopy.title.split(' – ')[1]}</span>
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        "font-mono font-black",
                                                        data.percent > 70 ? "text-green-600 border-green-200 bg-green-50" : data.percent > 40 ? "text-orange-600 border-orange-200 bg-orange-50" : "text-red-600 border-red-200 bg-red-50"
                                                    )}>
                                                        {data.raw}/20
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-4 text-slate-600 bg-slate-50 rounded-2xl">
                                                <p className="text-sm font-bold text-slate-800 italic">Co tato oblast měří: {areaCopy.what_it_measures}</p>
                                                <p className="text-sm leading-relaxed border-l-2 border-primary/20 pl-4">{scoreBand?.summary}</p>

                                                <div className="space-y-2 pt-2">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Doporučené kroky</span>
                                                    <div className="space-y-2">
                                                        {(data.raw < 14
                                                            ? (copyData.recommendations_by_area_low?.[area] ?? [])
                                                            : (levelInfo?.next_steps ?? []).slice(0, 2)
                                                        ).map((rec, i) => (
                                                            <div key={i} className="flex gap-2 items-start text-xs">
                                                                <BarChart3 className="h-3 w-4 text-primary mt-1 shrink-0" />
                                                                <span>{rec}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </div>
                    </div>
                </section>

                {/* SECTION: Doporučené kurzy na míru */}
                <CourseRecommendations result={result} />

                {/* SECTION 3: Srovnání s komunitou – TOP3 distribuce */}
                {aggregates != null && (
                    <section className="space-y-10 pt-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-1.5 rounded-full uppercase text-[10px] font-black tracking-widest ring-4 ring-blue-50">
                                Srovnání s komunitou
                            </Badge>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">Jak odpovídali ostatní?</h2>
                            <p className="text-slate-500 max-w-2xl mx-auto">
                                Vaše volby ve srovnání s <strong className="text-slate-700">{aggregates.count}</strong> dalšími účastníky.
                                <span className="ml-2 inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500"></span> = vaše volba</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <CommunityBarCard
                                title="Proč chcete používat AI?"
                                subtitle="Nejč. zvolené cíle (max. 3)"
                                questionId="Q0_2"
                                userAnswers={result.answers}
                                distributions={aggregates.questionDistributions}
                                totalRespondents={aggregates.count}
                                optionLabels={{
                                    save_time: 'Ušetřit čas',
                                    better_text: 'Lepší texty',
                                    analysis: 'Analýzy a podklady',
                                    content: 'Tvorba obsahu',
                                    automation: 'Automatizace',
                                    learning: 'Učení a rozvoj',
                                }}
                            />
                            <CommunityBarCard
                                title="Placené AI nástroje"
                                subtitle="Kolik nástrojů v placené verzi"
                                questionId="Q1_2b"
                                userAnswers={result.answers}
                                distributions={aggregates.questionDistributions}
                                totalRespondents={aggregates.count}
                                optionLabels={{
                                    '0': 'Žádné (bezplatné)',
                                    '1': 'Jeden',
                                    '2_3': 'Dva až tři',
                                    'up_to_6': 'Do šesti',
                                    'up_to_10': 'Do deseti',
                                    'gt_10': 'Více než 10',
                                }}
                            />
                            <CommunityBarCard
                                title="Co přidáváte do prompts?"
                                subtitle="Prvky zadání (oblast B, max. 4)"
                                questionId="QB2"
                                userAnswers={result.answers}
                                distributions={aggregates.questionDistributions}
                                totalRespondents={aggregates.count}
                                optionLabels={{
                                    context: 'Kontext / podklady',
                                    audience: 'Cílová skupina',
                                    tone: 'Tón a styl',
                                    format: 'Formát výstupu',
                                    quality_criteria: 'Kritéria kvality',
                                    example: 'Ukázka (example)',
                                    none: 'Nic z toho',
                                }}
                            />
                            <CommunityBarCard
                                title="Jaké kategorie nástrojů používáte?"
                                subtitle="Nejč. volené kategorie (max. 3)"
                                questionId="Q1_3"
                                userAnswers={result.answers}
                                distributions={aggregates.questionDistributions}
                                totalRespondents={aggregates.count}
                                optionLabels={{
                                    chatbots: 'Chatboty',
                                    presentations: 'Prezentace',
                                    images: 'Tvorba obrázků',
                                    video: 'Tvorba videa',
                                    meeting_notes: 'Záznamy schůzek',
                                    translation: 'Překladače',
                                    voice: 'Hlas / zvuk',
                                    none: 'Žádné',
                                }}
                            />
                            {!isV13 && (
                                <CommunityBarCard
                                    title="Jaké výstupy tvoříte s AI?"
                                    subtitle="Nejč. typy tvorby (oblast F, max. 3)"
                                    questionId="QF2"
                                    userAnswers={result.answers}
                                    distributions={aggregates.questionDistributions}
                                    totalRespondents={aggregates.count}
                                    optionLabels={{
                                        text: 'Texty',
                                        presentations: 'Prezentace',
                                        graphics: 'Grafika / obrázky',
                                        video: 'Video',
                                        code: 'Kód (programy)',
                                        voice: 'Hlas / zvuk',
                                        none: 'Netvořím obsah',
                                    }}
                                />
                            )}
                        </div>
                    </section>
                )}



                {/* SECTION 4: Metodická brzda */}
                {result.brakeApplied && (
                    <section className="animate-bounce-subtle">
                        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 relative overflow-hidden p-8 border-2">
                            <div className="flex gap-6 items-center">
                                <div className="bg-primary h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg">
                                    <ShieldAlert className="h-8 w-8 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-primary uppercase tracking-tighter">Metodická brzda: {(copyData as any).brakes_copy?.[result.brakeExplanationKey || 'brake_C']?.title || 'Pozor na oblast C'}</h3>
                                    <p className="text-slate-600 max-w-3xl leading-relaxed">{(copyData as any).brakes_copy?.[result.brakeExplanationKey || 'brake_C']?.text || ''}</p>
                                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border mt-4">
                                        <span className="text-[10px] font-black opacity-40 uppercase tracking-wider">Efekt na výsledek:</span>
                                        <span className="text-sm font-bold text-slate-900">Vaše C = {result.areaScores['C'].raw}/20 → Max Level = Explorer</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>
                )}



                {/* SECTION 6: Inovatix services CTA + WhatsApp */}
                <CtaSection result={result} onReset={onReset} />
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-border p-4 rounded-xl shadow-xl">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-lg font-black text-slate-900">{payload[0].value}%</p>
                </div>
            </div>
        );
    }
    return null;
}

function Check({ className, ...props }: any) {
    return (
        <svg
            {...props}
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function CommunityBarCard({
    title,
    subtitle,
    questionId,
    userAnswers,
    distributions,
    totalRespondents,
    optionLabels,
}: {
    title: string;
    subtitle: string;
    questionId: string;
    userAnswers: Record<string, any>;
    distributions: Record<string, Record<string, number>>;
    totalRespondents: number;
    optionLabels: Record<string, string>;
}) {
    const dist = distributions?.[questionId] || {};

    // Normalize user answer to array of values
    const rawAnswer = userAnswers?.[questionId];
    const userSelected: string[] = Array.isArray(rawAnswer)
        ? rawAnswer
        : rawAnswer ? [rawAnswer] : [];

    // Build sorted entries by vote count descending
    const entries = Object.entries(optionLabels)
        .map(([value, label]) => ({
            value,
            label,
            count: dist[value] || 0,
            isUser: userSelected.includes(value),
            percentage: totalRespondents > 0 ? Math.round((dist[value] || 0) / totalRespondents * 100) : 0,
        }))
        .filter(e => e.count > 0 || e.isUser)
        .sort((a, b) => b.count - a.count);

    return (
        <Card className="bg-card border-border overflow-hidden border-2 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-border pb-3 pt-4 px-6">
                <CardTitle className="text-sm font-black text-slate-800">{title}</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
            </CardHeader>
            <CardContent className="p-5">
                {entries.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-4 text-center">Zatím žádná data</p>
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(entries.length * 40, 100)}>
                        <BarChart
                            layout="vertical"
                            data={entries}
                            margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
                            barCategoryGap={8}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                width={130}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickFormatter={(value: string, index: number) => {
                                    const entry = entries[index];
                                    return entry?.isUser ? `▶ ${value}` : value;
                                }}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Bar
                                dataKey="percentage"
                                fill="#cbd5e1"
                                minPointSize={2}
                                radius={[4, 4, 4, 4]}
                                barSize={20}
                                animationDuration={500}
                                animationEasing="ease-out"
                                label={{
                                    position: 'right',
                                    formatter: (value: any) => `${value}%`,
                                    fill: '#64748b',
                                    fontSize: 12,
                                    fontWeight: 'medium',
                                }}
                            >
                                {entries.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.isUser ? '#007bff' : '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
