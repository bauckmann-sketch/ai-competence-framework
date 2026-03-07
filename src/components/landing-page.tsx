'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    Mail,
    BarChart3,
    Compass,
    Zap,
    Layers,
    MessageSquare,
    Users,
    Info,
    ArrowRight,
    Plus,
    Minus
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LandingPageProps {
    data: any;
    onStart: () => void;
}

const Section = ({
    children,
    className,
    id
}: {
    children: React.ReactNode;
    className?: string;
    id?: string
}) => (
    <section id={id} className={cn("py-20 px-6", className)}>
        <div className="max-w-4xl mx-auto">
            {children}
        </div>
    </section>
);

const AccordionItem = ({ q, a }: { q: string, a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group"
            >
                <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{q}</span>
                {isOpen ? (
                    <Minus className="h-5 w-5 text-slate-400 shrink-0" />
                ) : (
                    <Plus className="h-5 w-5 text-slate-400 shrink-0" />
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-slate-500 leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Demo radar chart for hero visual — shows what users get
const HERO_CHART_DATA = [
    { area: 'A', user: 16, avg: 11 },
    { area: 'B', user: 14, avg: 10 },
    { area: 'C', user: 12, avg: 8 },
    { area: 'D', user: 15, avg: 9 },
    { area: 'E', user: 10, avg: 7 },
];

function HeroRadarChart() {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={HERO_CHART_DATA} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Radar name="Váš výsledek" dataKey="user" stroke="#DD3C20" fill="#DD3C20" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#DD3C20' }} />
                <Radar name="Komunita" dataKey="avg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
                <Tooltip formatter={(v: any, name: string) => [`${v}/20`, name]} contentStyle={{ fontSize: 11 }} />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export function LandingPage({ data, onStart }: LandingPageProps) {
    const landing = data.landing_page;
    const sections = landing.sections;
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowSticky(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getSection = (id: string) => sections.find((s: any) => s.id === id);

    const hero = getSection('hero');
    const whatYouGet = getSection('what_you_get');
    const methodology = getSection('methodology');
    const privacyEmail = getSection('privacy_email');
    const preview = getSection('preview');
    const forWhom = getSection('for_whom');
    const credibility = getSection('credibility');
    const faq = getSection('faq');

    const ctaButton = (label: string = "Začít dotazník") => (
        <Button
            onClick={onStart}
            className="bg-primary hover:bg-primary/90 text-white font-black px-10 py-7 rounded-2xl text-lg shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all group gap-2"
        >
            {label}
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
    );

    return (
        <div className="bg-slate-50 min-h-screen font-inter selection:bg-primary/10">
            {/* LOGO HEADER */}
            <div className="flex justify-center pt-8 pb-0 px-6">
                <a href="https://www.inovatix.cz" target="_blank" rel="noopener noreferrer">
                    <img
                        src="/images/logo-inovatix-dark.svg"
                        alt="Inovatix"
                        className="h-10 md:h-12 w-auto"
                    />
                </a>
            </div>

            {/* 1. HERO SECTION — 2-column: text left, spider chart right */}
            <section className="pt-8 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        {/* LEFT: Text + CTA */}
                        <div className="space-y-8">
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 uppercase text-[10px] font-black tracking-[0.2em]">
                                AI Index · Diagnostika kompetencí
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                                    {hero.headline}
                                    {hero.headline_accent && (
                                        <span className="block text-primary mt-1">{hero.headline_accent}</span>
                                    )}
                                </h1>
                                <p className="text-lg text-slate-500 max-w-xl font-medium leading-relaxed">
                                    {hero.subheadline}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {hero.bullets.map((b: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-slate-700 font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                        <span>{b}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {ctaButton(hero.cta)}
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Info className="h-3 w-3 shrink-0" />
                                    {hero.disclaimer}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Spider chart visual preview */}
                        <div className="relative flex items-center justify-center hidden lg:flex">
                            {/* Glow background */}
                            <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent rounded-3xl" />

                            <div className="relative w-full max-w-sm">
                                {/* Card mockup */}
                                <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-primary">AI Competence Framework</div>
                                            <div className="text-lg font-black text-slate-900 mt-0.5">Váš AI Index</div>
                                        </div>
                                        <div className="bg-primary/10 rounded-2xl px-4 py-2 text-center">
                                            <div className="text-2xl font-black text-primary">77%</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Skóre</div>
                                        </div>
                                    </div>

                                    {/* Interactive radar chart demo */}
                                    <div className="h-52 -mx-2">
                                        <HeroRadarChart />
                                    </div>

                                    {/* Level badge */}
                                    <div className="bg-gradient-to-r from-orange-900 to-slate-900 rounded-2xl px-4 py-3 flex items-center gap-3">
                                        <div className="text-2xl">🏗️</div>
                                        <div>
                                            <div className="text-[10px] text-orange-300 font-black uppercase tracking-widest">Vaše úroveň</div>
                                            <div className="text-sm font-black text-white">Builder</div>
                                        </div>
                                        <div className="ml-auto text-[10px] text-orange-300/70 font-bold">Top 15 %</div>
                                    </div>
                                </div>

                                {/* Floating "community" badge */}
                                <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-lg border border-slate-100 px-3 py-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black text-slate-700">+2 400 respondentů</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* 2. WHAT YOU GET */}
            <Section className="bg-white border-y border-slate-100">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{whatYouGet.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {whatYouGet.cards.map((card: any, i: number) => (
                            <Card key={i} className="p-8 border-2 border-slate-50 hover:border-slate-100 hover:shadow-xl transition-all rounded-[32px] space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    {[<BarChart3 className="h-6 w-6 text-primary" />, <Zap className="h-6 w-6 text-primary" />, <ShieldCheck className="h-6 w-6 text-primary" />][i]}
                                </div>
                                <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{card.text}</p>
                            </Card>
                        ))}
                    </div>
                    <div className="text-center pt-4">
                        {ctaButton(whatYouGet.cta)}
                    </div>
                </div>
            </Section>

            {/* 3. METHODOLOGY */}
            <Section className="bg-slate-50">
                <div className="space-y-12 bg-white rounded-[40px] p-8 md:p-16 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Compass className="h-64 w-64" />
                    </div>
                    <div className="relative z-10 space-y-8 max-w-2xl">
                        <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold uppercase tracking-widest px-4 py-1">Metodika</Badge>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{methodology.headline}</h2>
                        <p className="text-slate-600 leading-relaxed text-lg italic">
                            {methodology.text}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {methodology.pillars.map((p: string, i: number) => (
                                <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 border border-slate-100">
                                    {p}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4">
                        {ctaButton(methodology.cta)}
                    </div>
                </div>
            </Section>

            {/* 4. PRIVACY & EMAIL */}
            <Section className="bg-white">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{privacyEmail.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {privacyEmail.cards.map((card: any, i: number) => (
                            <div key={i} className={cn(
                                "p-10 rounded-[32px] space-y-6 relative overflow-hidden group",
                                i === 0 ? "bg-slate-900 text-white" : "bg-primary text-white"
                            )}>
                                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                    {i === 0 ? <ShieldCheck className="h-7 w-7" /> : <Mail className="h-7 w-7" />}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black">{card.title}</h3>
                                    <p className={cn("leading-relaxed", i === 0 ? "text-slate-400" : "text-white/80")}>
                                        {card.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center pt-4">
                        {ctaButton(privacyEmail.cta)}
                    </div>
                </div>
            </Section>

            {/* 5. PREVIEW */}
            <Section className="bg-slate-50 border-y border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">{preview.headline}</h2>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            {preview.text}
                        </p>
                        <ul className="space-y-4">
                            {preview.preview_assets_hint.map((h: string, i: number) => (
                                <li key={i} className="flex items-center gap-3 text-slate-800 font-bold">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    {h}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-4">
                            {ctaButton(preview.cta)}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 rounded-[40px] blur-2xl group-hover:bg-primary/30 transition-all" />
                        <div className="relative bg-white p-6 rounded-[40px] border border-slate-200 shadow-2xl">
                            {/* Level badge */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ukázka výsledku</span>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Power User</span>
                            </div>

                            {/* Radar chart */}
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart
                                        cx="50%" cy="50%" outerRadius="72%"
                                        data={[
                                            { subject: 'A', user: 16, avg: 11, fullMark: 20 },
                                            { subject: 'B', user: 14, avg: 10, fullMark: 20 },
                                            { subject: 'C', user: 12, avg: 9, fullMark: 20 },
                                            { subject: 'D', user: 15, avg: 12, fullMark: 20 },
                                            { subject: 'E', user: 10, avg: 8, fullMark: 20 },
                                        ]}
                                    >
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: '#475569', fontSize: 13, fontWeight: 900 }}
                                        />
                                        <PolarRadiusAxis angle={90} domain={[0, 20]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Vás výsledek"
                                            dataKey="user"
                                            stroke="#DD3C20"
                                            fill="#DD3C20"
                                            fillOpacity={0.45}
                                        />
                                        <Radar
                                            name="Průměr komunity"
                                            dataKey="avg"
                                            stroke="#0EA5E9"
                                            fill="#0EA5E9"
                                            fillOpacity={0.15}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                            formatter={(value) => <span style={{ color: '#64748b', fontWeight: 700 }}>{value}</span>}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Mini score bars */}
                            <div className="mt-4 grid grid-cols-5 gap-2">
                                {[['A', 80], ['B', 70], ['C', 60], ['D', 75], ['E', 50]].map(([area, pct]) => (
                                    <div key={area} className="text-center space-y-1">
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 6. FOR WHOM */}
            <Section className="bg-white">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{forWhom.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {forWhom.columns.map((col: any, i: number) => (
                            <div key={i} className="p-10 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100 hover:-translate-y-1 transition-transform">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    {[<Users className="h-6 w-6 text-primary" />, <Users className="h-6 w-6 text-primary" />, <Building2 className="h-6 w-6 text-primary" />][i]}
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{col.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{col.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center pt-8">
                        {ctaButton(forWhom.cta)}
                    </div>
                </div>
            </Section>

            {/* 7. CREDIBILITY */}
            <Section className="bg-slate-900 text-white rounded-t-[60px] -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-4xl font-black leading-tight">{credibility.headline}</h2>
                        <div className="space-y-6">
                            {credibility.bullets.map((b: string, i: number) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <p className="text-slate-300 font-medium">{b}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
                                {credibility.disclaimer}
                            </p>
                            {ctaButton(credibility.cta)}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 opacity-50">
                        <div className="p-8 border border-white/10 rounded-2xl flex items-center justify-center aspect-square text-center">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">DigComp 2.2</span>
                        </div>
                        <div className="p-8 border border-white/10 rounded-2xl flex items-center justify-center aspect-square text-center">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">AI literacy</span>
                        </div>
                        <div className="p-8 border border-white/10 rounded-2xl flex items-center justify-center aspect-square text-center">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Behavioral Analysis</span>
                        </div>
                        <div className="p-8 border border-white/10 rounded-2xl flex items-center justify-center aspect-square text-center">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Inovatix Methodology</span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 8. FAQ */}
            <Section className="bg-white">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{faq.headline}</h2>
                    </div>
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden px-8">
                        {faq.items.map((item: any, i: number) => (
                            <AccordionItem key={i} q={item.q} a={item.a} />
                        ))}
                    </div>
                    <div className="text-center pt-8">
                        {ctaButton(faq.cta)}
                    </div>
                </div>
            </Section>

            {/* O NÁS */}
            <Section className="bg-white border-t border-slate-100">
                <div className="space-y-8 text-center">
                    <div className="flex justify-center">
                        <img
                            src="/images/logo-inovatix-dark.svg"
                            alt="Inovatix"
                            className="h-10 w-auto opacity-80"
                        />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900">O nás</h2>
                    <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-lg">
                        <strong>Inovatix</strong> je česká společnost zaměřená na praktické využití umělé inteligence ve firmách i u jednotlivců.
                        Pomáháme lidem a organizacím pochopit, jak AI funguje, jak ji bezpečně integrovat do pracovních procesů
                        a jak z ní vytěžit maximum — bez planého buzzwordu, ale s konkrétními výsledky.
                    </p>
                    <p className="text-slate-500 leading-relaxed max-w-3xl mx-auto">
                        Nabízíme školení, workshopy, individuální konzultace i komplexní AI implementace na míru.
                        AI Competence Framework je naší metodikou pro měření a rozvoj AI kompetencí — ověřenou na stovkách účastníků
                        napříč různými obory a rolemi.
                    </p>
                    <a
                        href="https://www.inovatix.cz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary font-black hover:underline text-sm uppercase tracking-widest"
                    >
                        Více o nás na inovatix.cz <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </Section>

            <footer className="bg-slate-50 py-10 px-6 border-t border-slate-100 text-center">
                <div className="max-w-4xl mx-auto">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        © 2026 Inovatix. Poskytujeme AI školení a implementace.
                    </p>
                </div>
            </footer>

            {/* STICKY CTA MOBILE */}
            <AnimatePresence>
                {showSticky && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 z-50 md:hidden flex justify-center"
                    >
                        <Button
                            onClick={onStart}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 text-base"
                        >
                            Začít dotazník <ArrowRight className="h-5 w-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
