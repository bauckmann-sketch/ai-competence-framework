'use client';

import React, { useState } from 'react';
import { QuestionnaireWizard } from '@/components/questionnaire-wizard';
import { ResultsDashboard } from '@/components/results-dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculationResult } from '@/types';
import questionsV1 from '@/data/v1/questions.json';
import questionsV3 from '@/data/v3/questions.json';
import questionsV4 from '@/data/v4/questions.json';
import questionsV6 from '@/data/v6/questions.json';
import questionsV7 from '@/data/v7/questions.json';
import questionsV8 from '@/data/v8/questions.json';
import questionsV9 from '@/data/v9/questions.json';

type AppState = 'intro' | 'wizard' | 'results';
type Version = 'v1' | 'v3' | 'v4' | 'v6' | 'v7' | 'v8' | 'v9';

export default function Home() {
  const [state, setState] = useState<AppState>('wizard');
  const [selectedVersion, setSelectedVersion] = useState<Version>('v9');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aggregates, setAggregates] = useState<any>(null);

  const startSurvey = (version: Version) => {
    setSelectedVersion(version);
    setState('wizard');
  };

  const handleComplete = async (answers: Record<string, any>) => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, version: selectedVersion }),
      });
      const data = await res.json();
      if (data.result) {
        // Show results whether or not there was a save error
        if (data.saveError) {
          console.warn('Save error (results still shown):', data.saveError);
        }
        setResult(data.result);
        setAggregates(data.aggregates);
        setState('results');
        localStorage.removeItem('ai-survey-state');
      } else {
        console.error('No result in response', data);
      }
    } catch (err) {
      console.error('Failed to submit survey', err);
    }
  };

  const reset = () => {
    setResult(null);
    setState('wizard');
    setSelectedVersion('v8');
    localStorage.removeItem('ai-survey-state');
  };

  const questionsData = {
    v1: questionsV1,
    v3: questionsV3,
    v4: questionsV4,
    v6: questionsV6,
    v7: questionsV7,
    v8: questionsV8,
    v9: questionsV9
  }[selectedVersion] || questionsV9;

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center text-center space-y-12 py-10 md:py-20"
            >
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 uppercase text-[10px] font-black tracking-[0.2em] shadow-sm">
                  Metodika Inovatix
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
                    AI Competence <br /><span className="text-primary italic">Framework</span>
                  </h1>
                </div>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                  Změřte svou připravenost na budoucnost práce s AI pomocí behaviorální analýzy návyků.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full">
                <Card
                  className="relative overflow-hidden group cursor-pointer border-2 border-slate-100 hover:border-slate-200 transition-all hover:shadow-xl bg-white p-1"
                  onClick={() => startSurvey('v1')}
                >
                  <CardHeader className="space-y-4 pt-6">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider shrink-0">Původní</Badge>
                      <span className="text-2xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">V1</span>
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl font-black text-slate-900">Standard</CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-500 font-medium leading-relaxed">
                        Klasické měření zaměřené na orientaci a nástroje.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="text-[13px] space-y-2 text-slate-600 mb-6 text-left">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Metodika A–F
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Fokus na nástroje
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full border-slate-200 text-slate-600 font-black py-5 rounded-xl group-hover:bg-slate-50 transition-all text-sm">
                      Spustit v1
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="relative overflow-hidden group cursor-pointer border-2 border-slate-100 hover:border-orange-200 transition-all hover:shadow-xl bg-white p-1"
                  onClick={() => startSurvey('v3')}
                >
                  <CardHeader className="space-y-4 pt-6">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-orange-100 text-orange-600 border-orange-200 rounded-lg px-2 py-0.5 font-black text-[9px] uppercase tracking-wider shrink-0">Behavioral</Badge>
                      <span className="text-2xl font-black text-slate-100 group-hover:text-orange-100 transition-colors">V3</span>
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl font-black text-slate-900">Behavior</CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-500 font-medium leading-relaxed">
                        Měření zaměřené na konkrétní návyky a efektivitu.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="text-[13px] space-y-2 text-slate-600 mb-6 text-left">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                        Analýza návyků
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                        Rychlejší výsledek
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full border-orange-200 text-orange-600 font-black py-5 rounded-xl group-hover:bg-orange-50 transition-all text-sm">
                      Spustit v3
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="relative overflow-hidden group cursor-pointer border-2 border-primary/20 hover:border-primary transition-all hover:shadow-2xl bg-white p-1 ring-1 ring-primary/5"
                  onClick={() => startSurvey('v4')}
                >
                  <div className="absolute top-0 right-0 p-3">
                    <Badge className="bg-primary text-white font-black animate-pulse shadow-lg shadow-primary/20 text-[9px]">DOPORUČENO</Badge>
                  </div>
                  <CardHeader className="space-y-4 pt-6">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-2 py-0.5 font-black text-[9px] uppercase tracking-wider shrink-0">Elite Behavior</Badge>
                      <span className="text-2xl font-black text-primary/10 group-hover:text-primary transition-colors">V4</span>
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl font-black text-slate-900">Projekt V4</CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-500 font-medium leading-relaxed">
                        Nejnovější metodika s vylepšenou přesností a fitness reportem.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="text-[13px] space-y-2 mb-6 text-left">
                      <li className="flex items-center gap-2 font-bold text-primary">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        AI Fitness Profiling
                      </li>
                      <li className="flex items-center gap-2 text-slate-700 font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Maximální přesnost
                      </li>
                    </ul>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black py-5 rounded-xl group-hover:scale-[1.02] transition-all text-sm">
                      Spustit v4 (Elite)
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-8 text-sm text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                <span>Zcela anonymní</span>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <span>Bez registrace</span>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <span>3–5 min</span>
              </div>
            </motion.div>
          )}

          {state === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <QuestionnaireWizard
                data={questionsData as any}
                onComplete={handleComplete}
              />
            </motion.div>
          )}

          {state === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsDashboard result={result} aggregates={aggregates} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
