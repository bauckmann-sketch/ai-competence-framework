'use client';

import React, { useMemo } from 'react';
import { CalculationResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, Gift, Sparkles } from 'lucide-react';
import { track } from '@/lib/track';
import courseData from '@/data/course-recommendations.json';

interface Course {
    name: string;
    slug: string;
    url: string;
    priority?: number;
    reason: string;
}

interface AreaRecommendation {
    area: string;
    areaLabel: string;
    score: number;
    maxScore: number;
    courses: Course[];
}

const MAX_COURSES_PER_AREA = 3;
const WEAK_AREA_THRESHOLD = 70; // percent — below this we recommend courses
const ALL_STRONG_THRESHOLD = 70; // if ALL areas above this, show creative courses

function getRecommendations(result: CalculationResult): {
    areaRecs: AreaRecommendation[];
    showAdvanced: boolean;
    totalCourseCount: number;
} {
    const areas = Object.entries(result.areaScores)
        .filter(([area]) => courseData.areas[area as keyof typeof courseData.areas])
        .map(([area, data]) => ({
            area,
            percent: data.percent,
            raw: data.raw,
            max: data.max,
        }))
        .sort((a, b) => a.percent - b.percent); // weakest first

    // Find areas below threshold
    const weakAreas = areas.filter(a => a.percent < WEAK_AREA_THRESHOLD);
    const allStrong = weakAreas.length === 0;

    // Take top 2 weakest areas (or all weak if only 1)
    const targetAreas = allStrong ? [] : weakAreas.slice(0, 2);

    // Deduplicate: track which course slugs we've already added
    const usedSlugs = new Set<string>();

    const areaRecs: AreaRecommendation[] = targetAreas.map(a => {
        const areaData = courseData.areas[a.area as keyof typeof courseData.areas];
        if (!areaData) return null;

        const courses = areaData.courses
            .sort((x, y) => (x.priority || 99) - (y.priority || 99))
            .filter(c => !usedSlugs.has(c.slug))
            .slice(0, MAX_COURSES_PER_AREA);

        courses.forEach(c => usedSlugs.add(c.slug));

        return {
            area: a.area,
            areaLabel: areaData.label,
            score: a.raw,
            maxScore: a.max,
            courses,
        };
    }).filter(Boolean) as AreaRecommendation[];

    const totalCourseCount = areaRecs.reduce((n, r) => n + r.courses.length, 0);

    return { areaRecs, showAdvanced: allStrong, totalCourseCount };
}

// ─── Area color helpers ─────────────────────────────────────────────────────
const areaColors: Record<string, { bg: string; text: string; border: string; tag: string }> = {
    A: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-700' },
    B: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700' },
    C: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', tag: 'bg-amber-100 text-amber-700' },
    D: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-700' },
    E: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', tag: 'bg-rose-100 text-rose-700' },
};

function CourseCard({ course, area, result }: { course: Course; area: string; result: CalculationResult }) {
    const colors = areaColors[area] || areaColors.A;
    return (
        <div className={`group flex flex-col gap-3 p-5 rounded-2xl border-2 ${colors.border} ${colors.bg} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
            <div className="space-y-1">
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.tag}`}>
                    Oblast {area}
                </span>
                <h4 className="text-base font-black text-slate-900 leading-tight">
                    {course.name}
                </h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed flex-1">{course.reason}</p>
            <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('course_click', {
                    course_slug: course.slug,
                    area,
                    level: result.level,
                    score: result.totalPercent,
                })}
                className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider ${colors.text} hover:underline mt-auto w-fit`}
            >
                <ExternalLink className="h-3.5 w-3.5" />
                Detail kurzu
            </a>
        </div>
    );
}

function BundleBanner({ courseCount, result }: { courseCount: number; result: CalculationResult }) {
    if (courseCount < 2) return null;

    const suggestedBundle = courseCount <= 4 ? courseData.bundles.small : courseData.bundles.large;
    const otherBundle = courseCount <= 4 ? courseData.bundles.large : courseData.bundles.small;

    return (
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-[28px] p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-black text-slate-900">
                        Ušetřete s balíčkem webinářů
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Doporučujeme vám {courseCount} kurzů. S balíčkem ušetříte až {suggestedBundle.discount}:
                    </p>
                    <div className="flex flex-wrap gap-3 pt-1">
                        <span className="inline-flex items-center gap-1.5 bg-white border border-primary/20 rounded-full px-4 py-1.5 text-sm font-bold text-slate-700">
                            <span className="text-primary font-black">{suggestedBundle.name}</span>
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-black">
                                sleva {suggestedBundle.discount}
                            </Badge>
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-bold text-slate-500">
                            <span>{otherBundle.name}</span>
                            <Badge variant="outline" className="text-[10px] font-black">
                                sleva {otherBundle.discount}
                            </Badge>
                        </span>
                    </div>
                </div>
                <a
                    href={suggestedBundle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('bundle_click', {
                        bundle: courseCount <= 4 ? 'small' : 'large',
                        recommended_courses: courseCount,
                        level: result.level,
                        score: result.totalPercent,
                    })}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black py-3.5 px-6 rounded-2xl text-sm transition-colors shadow-lg shadow-primary/20 whitespace-nowrap"
                >
                    <Gift className="h-4 w-4" />
                    Zobrazit balíčky
                </a>
            </div>
        </div>
    );
}

function AdvancedSection({ result }: { result: CalculationResult }) {
    const advancedBundle = (courseData as any).advanced_bundle;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-sm font-bold text-slate-600">
                    Vaše AI kompetence jsou na vysoké úrovni! Posuňte se na expert level:
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(courseData as any).advanced_courses.map((course: any) => (
                    <div
                        key={course.slug}
                        className="group flex flex-col gap-2 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <h4 className="text-sm font-black text-slate-900">{course.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed flex-1">{course.reason}</p>
                        <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => track('course_click', {
                                course_slug: course.slug,
                                area: 'advanced',
                                level: result.level,
                                score: result.totalPercent,
                            })}
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary hover:underline mt-auto w-fit"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Detail kurzu
                        </a>
                    </div>
                ))}
            </div>
            {advancedBundle && (
                <a
                    href={advancedBundle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('advanced_bundle_click', {
                        level: result.level,
                        score: result.totalPercent,
                    })}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 hover:shadow-lg transition-all group"
                >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-base font-black text-slate-900">{advancedBundle.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{advancedBundle.note}</p>
                    </div>
                    <span className="text-sm font-black text-primary group-hover:underline whitespace-nowrap">Zobrazit balíček →</span>
                </a>
            )}
        </div>
    );
}

export function CourseRecommendations({ result }: { result: CalculationResult }) {
    const { areaRecs, showAdvanced, totalCourseCount } = useMemo(() => getRecommendations(result), [result]);

    // Nothing to show (shouldn't happen, but guard)
    if (areaRecs.length === 0 && !showAdvanced) return null;

    return (
        <section className="space-y-10 pt-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-4">
                <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-1.5 rounded-full uppercase text-[10px] font-black tracking-widest ring-4 ring-green-50">
                    Na míru pro vás
                </Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                    {showAdvanced ? 'Pokročilé AI nástroje pro vás' : 'Doporučené kurzy pro vaše mezery'}
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    {showAdvanced
                        ? 'Vaše AI kompetence jsou na vysoké úrovni. Tyto pokročilé kurzy vás posunou na expert level.'
                        : 'Na základě vašich výsledků jsme vybrali kurzy, které vám pomohou zlepšit se v oblastech s největším potenciálem.'
                    }
                </p>
            </div>

            {/* Course cards */}
            {!showAdvanced && (
                <div className="space-y-8">
                    {areaRecs.map(rec => (
                        <div key={rec.area} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${areaColors[rec.area]?.tag || 'bg-slate-100 text-slate-500'}`}>
                                    {rec.area}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">{rec.areaLabel}</h3>
                                    <p className="text-xs text-slate-400">Vaše skóre: {rec.score}/{rec.maxScore}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rec.courses.map(course => (
                                    <CourseCard key={course.slug} course={course} area={rec.area} result={result} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAdvanced && <AdvancedSection result={result} />}

            {/* Bundle upsell */}
            <BundleBanner courseCount={showAdvanced ? 7 : totalCourseCount} result={result} />
        </section>
    );
}
