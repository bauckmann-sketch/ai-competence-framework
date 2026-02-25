'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionnaire } from '@/hooks/use-questionnaire';
import { QuestionnaireData, Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, Square, CheckSquare, Circle, Dot, MousePointer2, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProps {
    data: QuestionnaireData;
    onComplete: (answers: Record<string, any>) => void;
}

export function QuestionnaireWizard({ data, onComplete }: WizardProps) {
    const wizard = useQuestionnaire(data);
    const { currentQuestion, handleAnswer, answers } = wizard;

    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];
    const isValid = !currentQuestion.required || (currentAnswer !== undefined && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== ''));

    const handleNext = () => {
        if (wizard.isLast) {
            onComplete(answers);
        } else {
            wizard.next();
        }
    };

    const handleAnswerAndAdvance = (id: string, val: any) => {
        handleAnswer(id, val);

        // Auto-advance for single selection types
        if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'scale_0_4') {
            // Check if there's an "other" field that needs focus/filling
            const hasOtherInput = currentQuestion.ui?.other_text_if && currentQuestion.ui.other_text_if === val;

            if (!hasOtherInput) {
                setTimeout(() => {
                    handleNext();
                }, 400);
            }
        }
    };

    const isClassification = currentQuestion.section === 'S0';

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-end text-sm text-slate-500">
                    <div className="flex flex-col gap-1">
                        {currentQuestion.area && (
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-md shadow-primary/10">
                                    Oblast {currentQuestion.area}
                                </span>
                                <span className="font-bold text-slate-900">
                                    {data.framework.areas.find(a => a.code === currentQuestion.area)?.name}
                                </span>
                            </div>
                        )}
                        {!currentQuestion.area && (
                            <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border border-slate-200">
                                    Kontext
                                </span>
                                <span className="font-bold text-slate-900">
                                    {data.sections.find(s => s.id === currentQuestion.section)?.title}
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{wizard.currentQuestionIndex + 1} / {wizard.totalQuestions}</span>
                </div>
                <Progress value={wizard.progress} className="h-2 bg-slate-100" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <Card className="border-2 border-slate-100 shadow-xl bg-white overflow-hidden ring-1 ring-slate-100">
                        {isClassification && (
                            <div className="bg-blue-50 px-6 py-2 border-b border-blue-100 text-[10px] uppercase tracking-widest font-black text-blue-600 flex items-center justify-center gap-3">
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                                </div>
                                Klasifikační otázka — nepočítá se do výsledku
                                <div className="flex gap-1 rotate-180">
                                    {[1, 2, 3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                                </div>
                            </div>
                        )}
                        <CardHeader className="space-y-6 pt-10">
                            <CardTitle className="text-2xl md:text-3xl leading-[1.15] font-black tracking-tight text-slate-900 text-center px-4">
                                {/* Strip trailing "Vyberte max. X." from multi-select question titles */}
                                {currentQuestion.type === 'multi_select'
                                    ? currentQuestion.text.replace(/\s*Vyberte max\.\s*\d+\.?\s*$/i, '').replace(/\s*\(vyberte max\.\s*\d+\)\.?\s*$/i, '').trim()
                                    : currentQuestion.text}
                            </CardTitle>

                            <div className="flex justify-center gap-3">
                                {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'scale_0_4') && (
                                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-2xl shadow-sm group">
                                        <MousePointer2 className="h-4 w-4 text-orange-500 animate-bounce" />
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-[10px] uppercase font-black text-orange-600 tracking-wider">Metoda výběru</span>
                                            <span className="text-xs font-bold text-orange-700/60">Vyberte právě jednu možnost</span>
                                        </div>
                                    </div>
                                )}
                                {currentQuestion.type === 'multi_select' && (
                                    <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-2xl shadow-sm">
                                        <ListChecks className="h-4 w-4 text-cyan-600 animate-pulse" />
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-[10px] uppercase font-black text-cyan-600 tracking-wider">Metoda výběru</span>
                                            <span className="text-xs font-bold text-cyan-700/60">
                                                {currentQuestion.max_select
                                                    ? `Vyberte max. ${currentQuestion.max_select} možnosti`
                                                    : 'Vyberte jednu nebo více možností'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {currentQuestion.type === 'scale_0_4' && (
                                <CardDescription className="text-center font-medium text-slate-500 max-w-md mx-auto italic border-t border-slate-100 pt-4">
                                    "Zvolte úroveň, která nejlépe odpovídá vaší reálné praxi v posledních 3 měsících."
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 p-8 pt-0">
                            {renderQuestionInput(currentQuestion, data, currentAnswer, handleAnswerAndAdvance)}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center pt-4 px-2">
                <Button
                    variant="ghost"
                    onClick={wizard.back}
                    disabled={wizard.isFirst}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all px-6 py-6 font-bold"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Zpět
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!isValid}
                    className={cn(
                        "font-black text-sm tracking-widest uppercase px-12 py-7 rounded-2xl transition-all shadow-lg",
                        isValid
                            ? "bg-primary text-white hover:scale-[1.03] hover:shadow-primary/20 active:scale-95 translate-y-0"
                            : "bg-slate-200 text-slate-400 translate-y-1"
                    )}
                >
                    {wizard.isLast ? 'Dokončit měření' : 'Pokračovat'}
                    {!wizard.isLast && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}

function renderQuestionInput(
    question: Question,
    data: QuestionnaireData,
    value: any,
    onChange: (id: string, val: any) => void
) {
    switch (question.type) {
        case 'scale_0_4':
            return (
                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(data.ui.likert_0_4.labels).map(([key, label]) => {
                        const isSelected = value?.toString() === key;
                        return (
                            <button
                                key={key}
                                onClick={() => onChange(question.id, key)}
                                className={cn(
                                    "flex flex-col items-start p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group outline-none",
                                    isSelected
                                        ? "bg-orange-500 border-orange-500 ring-4 ring-orange-500/10 shadow-md"
                                        : "bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/50"
                                )}
                            >
                                <div className="flex items-center w-full justify-between z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center font-black transition-all",
                                            isSelected ? "bg-white text-orange-500 shadow-md" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {key}
                                        </div>
                                        <span className={cn("font-black text-xl transition-colors", isSelected ? "text-white" : "text-slate-700")}>
                                            {label}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        isSelected ? "border-white bg-white shadow-inner" : "border-slate-200"
                                    )}>
                                        {isSelected && <Check className="h-4 w-4 text-orange-500 stroke-[4px]" />}
                                    </div>
                                </div>
                                <p className={cn(
                                    "text-[13px] leading-relaxed mt-3 transition-colors pl-14 z-10",
                                    isSelected ? "text-white/90 font-medium" : "text-slate-500 group-hover:text-slate-600"
                                )}>
                                    {data.ui.likert_0_4.anchors[key]}
                                </p>
                            </button>
                        );
                    })}
                </div>
            );

        case 'single_choice':
            return (
                <div className="space-y-3">
                    {question.options?.map(option => {
                        const isSelected = value === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => onChange(question.id, option.value)}
                                className={cn(
                                    "w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between group outline-none relative overflow-hidden",
                                    isSelected
                                        ? "bg-white border-orange-500 ring-4 ring-orange-500/10 shadow-md"
                                        : "bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/50"
                                )}
                            >
                                <span className={cn("text-lg font-bold transition-colors z-10", isSelected ? "text-orange-600" : "text-slate-700 group-hover:text-slate-900")}>
                                    {option.label}
                                </span>
                                <div className={cn(
                                    "border-2 flex items-center justify-center transition-all shadow-inner z-10",
                                    isSelected
                                        ? "h-5 w-10 rounded-full border-orange-500 bg-orange-500 ring-4 ring-orange-100"
                                        : "h-8 w-8 rounded-full border-slate-200 group-hover:border-slate-300"
                                )}>
                                    {isSelected && <Check className="h-3 w-3 text-white stroke-[4px]" />}
                                </div>
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-500" />}
                            </button>
                        );
                    })}
                    {question.ui?.other_text_if && question.ui.other_text_if === value && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 px-2 tracking-widest leading-none block mb-2">{question.ui?.other_text_label || "Upřesněte"}</label>
                            <input
                                type="text"
                                placeholder="Vaše odpověď..."
                                className="w-full bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-900 font-bold"
                                onChange={(e) => onChange(question.id + '_other', e.target.value)}
                                autoFocus
                            />
                        </motion.div>
                    )}
                </div>
            );

        case 'multi_select':
            const currentValues = Array.isArray(value) ? value : [];
            const atMax = question.max_select ? currentValues.length >= question.max_select : false;
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        {question.options?.map(option => {
                            const isSelected = currentValues.includes(option.value);
                            const isDisabled = !isSelected && atMax;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        const exclusiveOpts = question.ui?.exclusive_options || question.logic?.exclusive_options || [];
                                        let next;
                                        if (isSelected) {
                                            next = currentValues.filter(v => v !== option.value);
                                        } else {
                                            if (question.max_select && currentValues.length >= question.max_select) {
                                                return;
                                            }
                                            if (exclusiveOpts.includes(option.value)) {
                                                next = [option.value];
                                            } else {
                                                next = [...currentValues.filter(v => !exclusiveOpts.includes(v)), option.value];
                                            }
                                        }
                                        onChange(question.id, next);
                                    }}
                                    className={cn(
                                        "w-full px-5 py-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group outline-none relative",
                                        isSelected
                                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
                                            : isDisabled
                                                ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                                                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                                    )}
                                >
                                    {/* Visible checkbox — always shown */}
                                    <div className={cn(
                                        "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                        isSelected
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-slate-300 bg-white group-hover:border-blue-400"
                                    )}>
                                        {isSelected && <Check className="h-4 w-4 text-white stroke-[3px]" />}
                                    </div>
                                    <span className={cn(
                                        "text-base font-semibold transition-colors leading-snug",
                                        isSelected ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"
                                    )}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );

        case 'email_optional': {
            const skipEmail = value === '__skip__';
            const emailValue = skipEmail ? '' : (value || '');
            return (
                <div className="space-y-5">
                    {/* Email input */}
                    <div className="relative group">
                        <input
                            type="email"
                            value={emailValue}
                            disabled={skipEmail}
                            onChange={(e) => onChange(question.id, e.target.value)}
                            placeholder="vas@email.cz"
                            className={cn(
                                "w-full border-2 p-6 rounded-3xl outline-none transition-all text-xl font-black text-center placeholder:text-slate-300",
                                skipEmail
                                    ? "bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-50 border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 text-slate-900"
                            )}
                        />
                        {!skipEmail && <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity" />}
                    </div>

                    {/* Skip checkbox */}
                    <button
                        onClick={() => onChange(question.id, skipEmail ? '' : '__skip__')}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-slate-100 hover:border-slate-200 bg-white transition-all group"
                    >
                        <div className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                            skipEmail ? "bg-slate-600 border-slate-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {skipEmail && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                        </div>
                        <span className="text-sm font-semibold text-slate-600">Email nezadám</span>
                    </button>

                    <p className="text-xs text-slate-400 text-center font-medium leading-relaxed px-2">
                        Email slouží pro zaslání reportu. Výsledky se zobrazí ihned po kliknutí na tlačítko.
                    </p>
                </div>
            );
        }

        default:
            return <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center font-bold text-red-500 text-sm italic">Chyba: Typ otázky "{question.type}" není implementován.</div>;
    }
}
