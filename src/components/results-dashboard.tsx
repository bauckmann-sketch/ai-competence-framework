'use client';

import React, { useMemo, useRef } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ComposedChart
} from 'recharts';
import { CalculationResult, AggregateStats, MarketBenchmark, CopyData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, Download, Mail, RefreshCw, Trophy, Users, BarChart3, Globe, ShieldAlert, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import copyDataV1 from '@/data/v1/copy.json';
import copyDataV3 from '@/data/v3/copy.json';
import copyDataV4 from '@/data/v4/copy.json';
import copyDataV6 from '@/data/v6/copy.json';
import copyDataV7 from '@/data/v7/copy.json';
import marketBenchmarkV1 from '@/data/v1/market_benchmark.json';
import marketBenchmarkV3 from '@/data/v3/market_benchmark.json';
import marketBenchmarkV4 from '@/data/v4/market_benchmark.json';
import marketBenchmarkV6 from '@/data/v6/market_benchmark.json';
import marketBenchmarkV7 from '@/data/v7/market_benchmark.json';
import { calculateMarketComparison } from '@/lib/benchmark-engine';
import { cn } from '@/lib/utils';

import { FitnessReport } from './fitness-report';

interface ResultsProps {
    result: CalculationResult;
    aggregates: AggregateStats | null;
    onReset: () => void;
}

export function ResultsDashboard({ result, aggregates, onReset }: ResultsProps) {
    const isV3 = result.version === 'v3';
    const isV4 = result.version === 'v4';
    const isV6 = result.version === 'v6';
    const isV7 = result.version === 'v7';

    const copyData = (isV7 ? copyDataV7 : (isV6 ? copyDataV6 : (isV4 ? copyDataV4 : (isV3 ? copyDataV3 : copyDataV1)))) as unknown as CopyData;
    const marketBenchmark = (isV7 ? marketBenchmarkV7 : (isV6 ? marketBenchmarkV6 : (isV4 ? marketBenchmarkV4 : (isV3 ? marketBenchmarkV3 : marketBenchmarkV1)))) as unknown as MarketBenchmark;

    const marketComparison = useMemo(() => {
        if (!aggregates) return null;
        return calculateMarketComparison(result.answers, marketBenchmark, aggregates);
    }, [result.answers, aggregates, marketBenchmark]);

    const chartData = Object.entries(result.areaScores).map(([area, data]) => ({
        subject: area,
        user: data.raw,
        avg: aggregates?.avgAreaScores?.[area] || 0,
        fullMark: 20,
    }));

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
                {/* Playful AI Fitness Summary */}
                <FitnessReport result={result} />

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
                        <h2 className="text-4xl font-black tracking-tight text-slate-900">Kompetenční profil A–F</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Váš výsledek napříč 6 klíčovými oblastmi metodiky Inovatix.</p>
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
                                                        {(data.raw < 14 ? copyData.recommendations_by_area_low[area] : levelInfo.next_steps.slice(0, 2)).map((rec, i) => (
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

                {/* SECTION 3: Srovnání s komunitou – TOP3 distribuce */}
                {aggregates && aggregates.count > 0 && (
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
                                subtitle="Nejčastěji zvolené cíle (max. 3)"
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
                                title="Kategorie AI nástrojů"
                                subtitle="Nejčastěji volené kategorie (max. 3)"
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
                                    translation: 'Překladace',
                                    voice: 'Hlas / zvuč',
                                    none: 'Žádné',
                                }}
                            />
                            <CommunityBarCard
                                title="Placené AI nástroje"
                                subtitle="Kolik nástrojů používáte v placené verzi"
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
                                title="Jaké výstupy tvoříte s AI?"
                                subtitle="Nejčastější typy tvorby (oblast F, max. 3)"
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

                {/* SECTION 5: Největší překážka + personalizace */}
                {barrierInfo && (
                    <section className="pt-8">
                        <div className="flex flex-col items-center text-center space-y-4 mb-10">
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-1.5 rounded-full uppercase text-[10px] font-black tracking-widest ring-4 ring-orange-50 text-xs">
                                Personalizace
                            </Badge>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">{copyData.barrier_copy?.title || 'Vaše překážky'}</h2>
                        </div>

                        <Card className="bg-card border-primary/20 overflow-hidden shadow-xl ring-1 ring-primary/5 border-2">
                            <div className="grid grid-cols-1 md:grid-cols-3">
                                <div className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-center gap-2">
                                    <span className="text-[10px] uppercase font-black text-primary tracking-widest leading-none">Váš profil bariér</span>
                                    <h3 className="text-2xl font-black leading-tight text-slate-900 mb-4">{barrierInfo.summary}</h3>
                                    {barrierInfo.linked_area && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <BarChart3 className="h-4 w-4" />
                                            <span className="text-xs">Souvisí s oblastí {barrierInfo.linked_area}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 p-8 md:p-12 space-y-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">Doporučení na míru</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {barrierInfo.suggestions.map((s, i) => (
                                            <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex gap-4">
                                                <div className="bg-primary/10 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                                                    <Zap className="h-4 w-4 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed text-slate-700">{s}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                {/* SECTION 6: Doporučený další krok (CTA) */}
                <section className="space-y-12 py-12 border-t border-border">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="inline-flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter text-slate-900">Další kroky pro úroveň <span className="text-primary italic">{result.level}</span></h2>
                        <p className="text-slate-500 text-lg max-w-3xl leading-relaxed">{levelInfo.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {levelInfo.next_steps.map((step, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="bg-card border border-border p-8 rounded-[32px] h-full flex flex-col items-center text-center space-y-6 hover:border-primary/40 transition-all hover:translate-y-[-8px] hover:shadow-xl">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary group-hover:scale-110 transition-transform">
                                        {idx + 1}
                                    </div>
                                    <p className="text-lg font-bold leading-snug text-slate-800">{step}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-black px-12 py-8 rounded-full text-lg shadow-lg shadow-primary/20 h-auto gap-3">
                            <Mail className="h-5 w-5" /> Zaslat report e-mailem
                        </Button>
                        <Button variant="outline" className="border-border hover:bg-slate-50 text-slate-600 font-bold px-12 py-8 rounded-full text-lg h-auto gap-3 border-2">
                            <Globe className="h-5 w-5" /> Chci školení / konzultaci
                        </Button>
                    </div>

                    <div className="flex justify-center pt-20 pb-10">
                        <Button variant="ghost" onClick={onReset} className="text-slate-400 hover:text-primary uppercase text-xs font-black tracking-[0.3em] gap-3">
                            <RefreshCw className="h-4 w-4" /> Resetovat a začít znovu
                        </Button>
                    </div>
                </section>
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
