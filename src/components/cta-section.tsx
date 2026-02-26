'use client';

import React, { useState, useMemo } from 'react';
import { CalculationResult } from '@/types';
import { Building2, GraduationCap, X, ExternalLink, ChevronRight, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHATSAPP_URL = 'https://chat.whatsapp.com/GQDdu5fvzSn5XYis1MkvWb';
const WHATSAPP_QR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(WHATSAPP_URL)}&format=png&margin=12&color=000000&bgcolor=ffffff`;

// ─── Small helpers ────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, required }: { checked: boolean; onChange: (v: boolean) => void; label: string; required?: boolean }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <div
                onClick={() => onChange(!checked)}
                className={`mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary/50'}`}
            >
                {checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm text-slate-600 leading-relaxed">{label}{required && <span className="text-primary ml-1">*</span>}</span>
        </label>
    );
}

function SelectPills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(o => (
                <button key={o.value} type="button" onClick={() => onChange(o.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${value === o.value ? 'bg-primary text-white border-primary shadow-sm' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function MultiPills({ options, value, onChange, max }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max: number }) {
    const toggle = (v: string) => {
        if (value.includes(v)) {
            onChange(value.filter(x => x !== v));
        } else if (value.length < max) {
            onChange([...value, v]);
        }
    };
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(o => {
                const active = value.includes(o.value);
                return (
                    <button key={o.value} type="button" onClick={() => toggle(o.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${active ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:border-primary/40'} ${!active && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
            {children}
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

function Input({ type = 'text', placeholder, value, onChange, required }: { type?: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean }) {
    return (
        <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors bg-white" />
    );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-8 overflow-y-auto" style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl my-auto">
                <button onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors z-10">
                    <X className="h-5 w-5" />
                </button>
                {children}
            </div>
        </div>
    );
}

// ─── Implementation modal ─────────────────────────────────────────────────────
const PEOPLE_OPTS = [
    { value: '1-10', label: '1–10 lidí' },
    { value: '11-30', label: '11–30 lidí' },
    { value: '31-80', label: '31–80 lidí' },
    { value: '81-200', label: '81–200 lidí' },
    { value: '200+', label: '200+ lidí' },
];
const DEPTH_OPTS = [
    { value: 'start', label: '🟢 Start — AI základy + bezpečný provoz' },
    { value: 'practical', label: '🟡 Praktický výkon — workflow + šablony' },
    { value: 'advanced', label: '🔴 Pokročilá implementace — automatizace + governance' },
];
const SPEED_OPTS = [
    { value: '1', label: '1 den – rychlý start' },
    { value: '2', label: '2–3 dny – reálný posun' },
    { value: '8', label: '4–8 týdnů – implementace + změna procesů' },
];
const FORMAT_OPTS = [
    { value: 'Online', label: 'Online' },
    { value: 'Onsite', label: 'Na místě' },
    { value: 'Kombinace', label: 'Kombinace' },
];

// Dynamic price calc: 40k per group (15 people) per day
function calcImplementationPrice(peopleVal: string, daysVal: string): string | null {
    const peopleMap: Record<string, number> = { '1-10': 8, '11-30': 22, '31-80': 55, '81-200': 140, '200+': 250 };
    const peopleMid = peopleMap[peopleVal];
    if (!peopleMid || !daysVal) return null;
    const days = parseInt(daysVal, 10) || 1;
    const groups = Math.ceil(peopleMid / 15);
    const price = groups * days * 40000;
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);
}

function ImplementationModal({ open, onClose, result }: { open: boolean; onClose: () => void; result: CalculationResult }) {
    const [people, setPeople] = useState('');
    const [depth, setDepth] = useState('');
    const [speed, setSpeed] = useState('');
    const [format, setFormat] = useState('');
    const [email, setEmail] = useState(() => {
        const a = result.answers?.['QX2'] || result.answers?.['Q0_EMAIL'] || '';
        return a === '__skip__' ? '' : a;
    });
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [consentContact, setConsentContact] = useState(false);
    const [consentNewsletter, setConsentNewsletter] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const estimatedPrice = useMemo(() => calcImplementationPrice(people, speed), [people, speed]);


    const handleSubmitImpl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consentContact) { setError('Souhlas s kontaktováním je povinný.'); return; }
        setError(''); setSubmitting(true);
        try {
            const r = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_type: 'implementation',
                    email, phone, company,
                    role: result.answers?.['Q0_1'],
                    people_count: people, program_depth: depth, speed, format,
                    estimated_price: estimatedPrice,
                    consent_marketing: consentContact, consent_newsletter: consentNewsletter,
                    skill_score_total: result.totalPercent,
                    level: result.level,
                    area_scores: result.areaScores,
                    usage_frequency: result.answers?.['Q1_2'],
                    paid_tools_count: result.answers?.['Q1_2b'],
                    barrier: result.answers?.['QX3'],
                    instrument_version: result.version,
                }),
            });
            if (r.ok) { setSubmitted(true); } else { setError('Nepodařilo se odeslat. Zkuste znovu.'); }
        } catch { setError('Chyba připojení. Zkuste znovu.'); }
        setSubmitting(false);
    };

    return (
        <Modal open={open} onClose={onClose}>
            {submitted ? (
                <div className="p-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Poptávka odeslána!</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Ozveme se vám do 24 hodin s orientační nabídkou na míru. Připravíme ji na základě vašich výsledků.</p>
                    <Button onClick={onClose} className="bg-primary text-white rounded-full px-8 font-black mt-4">Zpět na výsledky</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmitImpl} className="p-8 space-y-7">
                    <div className="space-y-1 pr-8">
                        <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firemní implementace</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">Zavést AI do vaší firmy</h2>
                        <p className="text-sm text-slate-500">Vyplňte pár otázek (60 s) a dostanete orientační nabídku do 24 h.</p>
                    </div>

                    <Field label="Počet lidí k vyškolení">
                        <SelectPills options={PEOPLE_OPTS} value={people} onChange={setPeople} />
                    </Field>

                    <Field label="Hloubka programu" hint="Čím hlubší program, tím větší a trvalejší dopad.">
                        <SelectPills options={DEPTH_OPTS} value={depth} onChange={setDepth} />
                    </Field>

                    <Field label="Délka programu">
                        <SelectPills options={SPEED_OPTS} value={speed} onChange={setSpeed} />
                    </Field>

                    <Field label="Formát školení">
                        <SelectPills options={FORMAT_OPTS} value={format} onChange={setFormat} />
                    </Field>

                    {/* Dynamic price estimate */}
                    {estimatedPrice && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Orientační cena</p>
                            <p className="text-2xl font-black text-primary">{estimatedPrice}</p>
                            <p className="text-xs text-slate-400 mt-1">Kalkulace: skupiny po 15 lidech × 40 000 Kč / školící den. Přesná nabídka po upřesnění.</p>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Kontakt</p>
                        <Input placeholder="Email *" value={email} onChange={setEmail} required type="email" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Telefon" value={phone} onChange={setPhone} />
                            <Input placeholder="Firma" value={company} onChange={setCompany} />
                        </div>
                        <div className="space-y-3 pt-1">
                            <Checkbox checked={consentContact} onChange={setConsentContact} required
                                label="Souhlasím s kontaktováním ohledně nabídky Inovatix" />
                            <Checkbox checked={consentNewsletter} onChange={setConsentNewsletter}
                                label="Chci dostávat newsletters a novinky (volitelné)" />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                    <Button type="submit" disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-base h-auto gap-2 shadow-lg shadow-primary/20">
                        {submitting ? 'Odesílám…' : <><Send className="h-4 w-4" /> Odeslat poptávku</>}
                    </Button>
                </form>
            )}
        </Modal>
    );
}

// ─── Training modal ───────────────────────────────────────────────────────────
const DEPTH_INDIVIDUAL_OPTS = [
    { value: 'start', label: '🟢 Chci začít — online kurz ~16h', price: 'cca 8 000 Kč' },
    { value: 'intensive', label: '🟡 Naučit se rychle — 40h za 3 měsíce', price: 'cca 15 000 Kč' },
    { value: 'select', label: '🔵 Vyberu si kurzy — 1 200 Kč / kurz', price: 'od 1 200 Kč' },
    { value: 'coaching', label: '🔴 Individuální lekce a konzultace', price: 'na dotaz' },
];

function TrainingModal({ open, onClose, result }: { open: boolean; onClose: () => void; result: CalculationResult }) {
    const [selectedDepth, setSelectedDepth] = useState('');
    const [email, setEmail] = useState(() => {
        const a = result.answers?.['QX2'] || result.answers?.['Q0_EMAIL'] || '';
        return a === '__skip__' ? '' : a;
    });
    const [consentContact, setConsentContact] = useState(false);
    const [consentNewsletter, setConsentNewsletter] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const selectedDepthInfo = DEPTH_INDIVIDUAL_OPTS.find(o => o.value === selectedDepth);

    const handleSubmitTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consentContact) { setError('Souhlas s kontaktováním je povinný.'); return; }
        setError(''); setSubmitting(true);
        try {
            const r = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_type: 'training_1to1',
                    email,
                    depth: selectedDepth,
                    estimated_price: selectedDepthInfo?.price,
                    role: result.answers?.['Q0_1'],
                    consent_marketing: consentContact,
                    consent_newsletter: consentNewsletter,
                    skill_score_total: result.totalPercent,
                    level: result.level,
                    area_scores: result.areaScores,
                    usage_frequency: result.answers?.['Q1_2'],
                    paid_tools_count: result.answers?.['Q1_2b'],
                    barrier: result.answers?.['QX3'],
                    instrument_version: result.version,
                }),
            });
            if (r.ok) { setSubmitted(true); } else { setError('Nepodařilo se odeslat. Zkuste znovu.'); }
        } catch { setError('Chyba připojení. Zkuste znovu.'); }
        setSubmitting(false);
    };

    return (
        <Modal open={open} onClose={onClose}>
            {submitted ? (
                <div className="p-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Výborně!</h3>
                    <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">Do 24 hodin vám pošleme e-mail se 3 balíčky individuálního školení a možnostmi termínů.</p>
                    <Button onClick={onClose} className="bg-primary text-white rounded-full px-8 font-black mt-4">Zpět na výsledky</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmitTraining} className="p-8 space-y-7">
                    <div className="space-y-1 pr-8">
                        <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                            <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Školení pro jednotlivce</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">Školení na míru</h2>
                        <p className="text-sm text-slate-500">Vyberte, jak hluboko se chcete ponořit. Poskytneme vám konkrétní nabídku termínů do 24 h.</p>
                    </div>

                    <Field label="Jak hluboké znalosti chcete získat?">
                        <div className="space-y-2">
                            {DEPTH_INDIVIDUAL_OPTS.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setSelectedDepth(opt.value)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex justify-between items-center ${selectedDepth === opt.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 hover:border-primary/40'
                                        }`}>
                                    <span className="text-sm font-semibold">{opt.label}</span>
                                    <span className={`text-sm font-black whitespace-nowrap ml-4 ${selectedDepth === opt.value ? 'text-primary' : 'text-slate-400'
                                        }`}>{opt.price}</span>
                                </button>
                            ))}
                        </div>
                    </Field>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <Input placeholder="Email *" value={email} onChange={setEmail} required type="email" />
                        <div className="space-y-3">
                            <Checkbox checked={consentContact} onChange={setConsentContact} required
                                label="Souhlasím s kontaktováním ohledně nabídky Inovatix" />
                            <Checkbox checked={consentNewsletter} onChange={setConsentNewsletter}
                                label="Chci dostávat newsletters a novinky (volitelné)" />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                    <Button type="submit" disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-base h-auto gap-2 shadow-lg shadow-primary/20">
                        {submitting ? 'Odesílám…' : <><Send className="h-4 w-4" /> Chci možnosti školení</>}
                    </Button>
                </form>
            )}
        </Modal>
    );
}

// ─── WhatsApp block ───────────────────────────────────────────────────────────
function WhatsAppBlock() {
    return (
        <div className="bg-gradient-to-r from-[#1a3c2a] to-[#0d2218] rounded-[28px] overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Text side */}
                <div className="p-8 flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-2">
                        {/* WhatsApp icon */}
                        <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#25D366" />
                            <path d="M8 24l1.135-4.144A8.188 8.188 0 1 1 16.083 24.2L8 24z" fill="#fff" />
                            <path d="M13.07 11.2c-.22-.49-.452-.5-.661-.51l-.564-.01c-.196 0-.515.074-.784.368s-1.03 1.007-1.03 2.455 1.054 2.846 1.2 3.044c.147.196 2.03 3.24 5.013 4.415.7.27 1.247.43 1.672.55.703.2 1.343.17 1.849.103.564-.075 1.737-.71 1.982-1.396.245-.686.245-1.274.171-1.396-.073-.12-.268-.196-.563-.343s-1.737-.857-2.006-.955c-.269-.098-.465-.147-.661.147s-.759.955-.93 1.15c-.17.196-.34.22-.635.074-.294-.146-1.242-.458-2.367-1.46-.875-.78-1.465-1.743-1.636-2.037-.171-.294-.017-.453.129-.599.13-.131.294-.343.44-.514.148-.172.197-.295.296-.49.098-.197.049-.37-.025-.515-.074-.147-.66-1.593-.904-2.18z" fill="#25D366" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400">WhatsApp skupina</span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight">Novinky ze světa AI</h3>
                    <p className="text-green-200 text-sm leading-relaxed">AI novinky několikrát týdně, bez spamu.</p>

                    {/* Mobile: big button (hidden on desktop) */}
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                        className="md:hidden flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black py-3.5 px-6 rounded-2xl text-base transition-colors shadow-lg">
                        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none"><circle cx="16" cy="16" r="16" fill="white" fillOpacity=".2" /><path d="M8 24l1.135-4.144A8.188 8.188 0 1 1 16.083 24.2L8 24z" fill="#fff" /><path d="M13.07 11.2c-.22-.49-.452-.5-.661-.51l-.564-.01c-.196 0-.515.074-.784.368s-1.03 1.007-1.03 2.455 1.054 2.846 1.2 3.044c.147.196 2.03 3.24 5.013 4.415.7.27 1.247.43 1.672.55.703.2 1.343.17 1.849.103.564-.075 1.737-.71 1.982-1.396.245-.686.245-1.274.171-1.396-.073-.12-.268-.196-.563-.343s-1.737-.857-2.006-.955c-.269-.098-.465-.147-.661.147s-.759.955-.93 1.15c-.17.196-.34.22-.635.074-.294-.146-1.242-.458-2.367-1.46-.875-.78-1.465-1.743-1.636-2.037-.171-.294-.017-.453.129-.599.13-.131.294-.343.44-.514.148-.172.197-.295.296-.49.098-.197.049-.37-.025-.515-.074-.147-.66-1.593-.904-2.18z" fill="#25D366" /></svg>
                        Přidat se do skupiny
                    </a>

                    {/* Desktop: fallback link */}
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                        className="hidden md:inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 text-sm font-semibold transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Otevřít odkaz (bez naskenování)
                    </a>
                </div>

                {/* QR side — desktop only */}
                <div className="hidden md:flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl p-3 shadow-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={WHATSAPP_QR} alt="QR kód pro WhatsApp skupinu Novinky ze světa AI" width={180} height={180} className="block" />
                        <p className="text-center text-[10px] font-bold text-slate-500 mt-2">Naskenujte a přidejte se</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CtaSection({ result, onReset }: { result: CalculationResult; onReset: () => void }) {
    const [showImpl, setShowImpl] = useState(false);
    const [showTraining, setShowTraining] = useState(false);

    return (
        <section className="space-y-8 py-12 border-t border-border">
            {/* Heading */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
                    Váš výsledek je <span className="text-primary italic">výchozí bod</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                    Víme, co umíte a kde máte rezervy. Vyberte, jak chcete pokračovat.
                </p>
            </div>

            {/* CTA cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Implementation card */}
                <div className="group bg-white border-2 border-slate-100 hover:border-primary/30 rounded-[28px] p-8 flex flex-col gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Pro firmy</p>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Zavést AI do celého týmu</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Workshop nebo program na míru pro 5–200+ lidí. Mapování firemního workflow a návrhy využití AI. Měřitelná úspora času od prvního dne.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Button onClick={() => setShowImpl(true)}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black rounded-2xl py-3.5 h-auto gap-2 shadow-md shadow-primary/20">
                            Poptat implementaci <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Training card */}
                <div className="group bg-white border-2 border-slate-100 hover:border-slate-300 rounded-[28px] p-8 flex flex-col gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap className="h-7 w-7 text-slate-600" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pro jednotlivce</p>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Školení pro jednotlivce</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Školení základů i pokročilých technik a nástrojů. Konzultace nebo workshop zaměřený přesně na oblasti, kde ztrácíte čas a potenciál.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Button onClick={() => setShowTraining(true)} variant="outline"
                            className="w-full border-2 border-slate-200 hover:border-slate-400 text-slate-700 font-black rounded-2xl py-3.5 h-auto gap-2">
                            Zjistit možnosti <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* WhatsApp block */}
            <WhatsAppBlock />

            {/* Reset */}
            <div className="flex justify-center pt-6">
                <Button variant="ghost" onClick={onReset} className="text-slate-400 hover:text-primary uppercase text-xs font-black tracking-[0.3em] gap-3">
                    <RefreshCw className="h-4 w-4" /> Resetovat a začít znovu
                </Button>
            </div>

            {/* Modals */}
            <ImplementationModal open={showImpl} onClose={() => setShowImpl(false)} result={result} />
            <TrainingModal open={showTraining} onClose={() => setShowTraining(false)} result={result} />
        </section>
    );
}
