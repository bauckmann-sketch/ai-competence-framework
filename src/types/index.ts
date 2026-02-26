export type QuestionType = 'single_choice' | 'multi_select' | 'scale_0_4' | 'email_optional' | 'text_optional';

export interface Option {
    value: string;
    label: string;
}

export interface Question {
    id: string;
    section: string;
    area?: string;
    type: QuestionType;
    required: boolean;
    text: string;
    options?: Option[];
    max_select?: number;
    logic?: {
        branch_rules?: BranchRule[];
        exclusive_options?: string[];
    };
    ui?: {
        other_text_if?: string;
        other_text_label?: string;
        other_text_required?: boolean;
        exclusive_options?: string[];
        page_id?: string;
        cta_primary_label?: string;
        cta_secondary_label?: string;
        cta_secondary_style?: string;
        submit_behavior?: string;
    };
}

export interface BranchRule {
    if_any_selected: string[];
    then_enable_blocks: string[];
}

export interface Section {
    id: string;
    title: string;
    scored: boolean;
    area?: string;
}

export interface AggregateStats {
    count: number;
    avgTotalScore: number;
    avgAreaScores: Record<string, number>;
    levelDistribution: Record<string, number>;
    questionDistributions: Record<string, Record<string, number>>;
}

export interface AreaCopy {
    title: string;
    what_it_measures: string;
    score_bands: {
        range: [number, number];
        summary: string;
    }[];
}

export interface LevelCopy {
    headline: string;
    description: string;
    next_steps: string[];
}

export interface BarrierMapping {
    summary: string;
    linked_area: string | null;
    suggestions: string[];
}

export interface QuestionnaireData {
    framework: {
        name: string;
        areas: { code: string; name: string }[];
    };
    ui: {
        likert_0_4: {
            labels: Record<string, string>;
            anchors: Record<string, string>;
        };
    };
    sections: Section[];
    questions: Question[];
}

export interface MarketBenchmark {
    schema_version: string;
    title: string;
    benchmarks: Record<string, {
        question_id: string;
        values: Record<string, number | null>;
    }>;
}

export interface CopyData {
    framework_name: string;
    area_copy: Record<string, AreaCopy>;
    level_copy: Record<string, LevelCopy>;
    brakes_copy?: Record<string, { title: string; text: string }>;
    recommendations_by_area_low: Record<string, string[]>;
    market_context?: {
        title: string;
        note: string;
        fields: { question_id: string; label: string }[];
    };
    barrier_copy?: {
        title: string;
        question_id: string;
        mapping: Record<string, BarrierMapping>;
    };
}

export interface ScoringConfig {
    framework: {
        areas: string[];
        area_max_points: number;
        total_max_points: number;
    };
    scales?: {
        scale_0_4_to_points: {
            multiplier: number;
            max_points: number;
        };
    };
    behavior_scoring: Record<string, {
        max_points: number;
        mode?: 'count_selected';
        points_per_item?: number;
        eligible_values?: string[];
        exclusive_zero?: string;
        map?: Record<string, number>;
    }>;
    area_questions: Record<string, {
        scale?: string[];
        behavior?: string[];
    }>;
    extensions?: Record<string, {
        questions: string[];
        affects_total_score: boolean;
    }>;
    leveling: {
        levels: {
            name: string;
            min_percent: number;
            max_percent: number;
        }[];
        brakes: {
            type: string;
            area: string;
            rules: {
                min_area_points?: number;
                max_area_points_exclusive?: number;
                cap_level: string | null;
            }[];
            explanation_key: string;
        }[];
    };
}

export interface CalculationResult {
    totalScore: number;
    totalPercent: number;
    level: string;
    areaScores: Record<string, {
        raw: number;
        max: number;
        percent: number;
    }>;
    brakeApplied: boolean;
    brakeExplanationKey?: string;
    answers: Record<string, any>; // Store answers for benchmark comparison
    version?: string;
    secondaryMetrics?: Record<string, any>;
}
