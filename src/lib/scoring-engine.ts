import { ScoringConfig, CalculationResult } from '../types';

export function calculateScore(
    answers: Record<string, any>,
    config: ScoringConfig
): CalculationResult {
    const areaScores: Record<string, { raw: number; max: number; percent: number }> = {};
    let totalRawScore = 0;

    // 1. Calculate Area Scores (A-F)
    for (const areaCode of config.framework.areas) {
        const questions = config.area_questions[areaCode];
        let areaPoints = 0;

        // Scale questions (e.g., Likert 0-4) - Skip if not defined in config (v3)
        if (questions.scale && config.scales) {
            for (const qId of questions.scale) {
                const val = parseInt(answers[qId]);
                if (!isNaN(val)) {
                    areaPoints += val * config.scales.scale_0_4_to_points.multiplier;
                }
            }
        }

        // Behavioral questions (single/multi choice with mapping)
        if (questions.behavior) {
            for (const qId of questions.behavior) {
                const behaviorConfig = config.behavior_scoring[qId];
                if (!behaviorConfig) continue;

                const val = answers[qId];

                if (behaviorConfig.mode === 'count_selected') {
                    if (Array.isArray(val)) {
                        // Check for exclusive zero (e.g., "none")
                        if (behaviorConfig.exclusive_zero && val.includes(behaviorConfig.exclusive_zero)) {
                            areaPoints += 0;
                        } else {
                            const eligibleCount = val.filter(v =>
                                behaviorConfig.eligible_values?.includes(v)
                            ).length;
                            areaPoints += eligibleCount * (behaviorConfig.points_per_item || 0);
                        }
                    }
                } else if (behaviorConfig.mode === 'weighted_sum_selected') {
                    if (Array.isArray(val)) {
                        // Exclusive zero check
                        if (behaviorConfig.exclusive_zero && val.includes(behaviorConfig.exclusive_zero)) {
                            areaPoints += 0;
                        } else {
                            const bc = behaviorConfig as any;
                            const weights: Record<string, number> = bc.weights || {};
                            let sum = 0;
                            for (const selected of val) {
                                sum += weights[selected] || 0;
                            }
                            const capped = bc.cap ? Math.min(sum, bc.cap) : sum;
                            areaPoints += capped;
                        }
                    }
                } else if (behaviorConfig.map) {
                    const points = behaviorConfig.map[val] || 0;
                    areaPoints += points;
                }
            }
        }

        // Clamp area score to max
        const finalAreaPoints = Math.min(areaPoints, config.framework.area_max_points);
        areaScores[areaCode] = {
            raw: finalAreaPoints,
            max: config.framework.area_max_points,
            percent: Math.round((finalAreaPoints / config.framework.area_max_points) * 100)
        };

        totalRawScore += finalAreaPoints;
    }

    // 2. Total Percentage
    const totalPercent = Math.round((totalRawScore / config.framework.total_max_points) * 100);

    // 3. Determine Initial Level
    let currentLevel = config.leveling.levels[0].name;
    for (const level of config.leveling.levels) {
        if (totalPercent >= level.min_percent) {
            currentLevel = level.name;
        }
    }

    // 4. Apply Brakes (e.g., Area C brake)
    let brakeApplied = false;
    let brakeExplanationKey: string | undefined;

    for (const brake of config.leveling.brakes) {
        if (brake.type === 'cap_level_by_area_score') {
            const areaPoints = areaScores[brake.area]?.raw || 0;
            const rule = brake.rules.find(r => {
                const minOk = r.min_area_points === undefined || areaPoints >= r.min_area_points;
                const maxOk = r.max_area_points_exclusive === undefined || areaPoints < r.max_area_points_exclusive;
                return minOk && maxOk;
            });

            if (rule && rule.cap_level) {
                const currentLevelIdx = config.leveling.levels.findIndex(l => l.name === currentLevel);
                const capLevelIdx = config.leveling.levels.findIndex(l => l.name === rule.cap_level);

                if (currentLevelIdx > capLevelIdx) {
                    currentLevel = rule.cap_level;
                    brakeApplied = true;
                    brakeExplanationKey = brake.explanation_key;
                }
            }
        }
    }

    // 5. Compute secondary_metrics (v8+)
    let secondaryMetrics: Record<string, any> | undefined;
    if ((config as any).secondary_metrics) {
        const sm = (config as any).secondary_metrics;
        const computed: Record<string, any> = {};

        // Scalar indices (map-based)
        for (const [key, def] of Object.entries(sm) as [string, any][]) {
            if (def.type === 'derived_sum') continue;
            if (def.question_id && def.map) {
                const val = answers[def.question_id];
                computed[key] = def.map[val] ?? null;
            }
        }

        // Derived sums (e.g., adoption_investment_index)
        for (const [key, def] of Object.entries(sm) as [string, any][]) {
            if (def.type !== 'derived_sum') continue;
            const sum = (def.components as string[]).reduce((acc, comp) => {
                const v = computed[comp];
                return acc + (typeof v === 'number' ? v : 0);
            }, 0);
            let bandLabel: string | undefined;
            if (def.bands) {
                for (const band of def.bands as { range: [number, number]; label: string }[]) {
                    if (sum >= band.range[0] && sum <= band.range[1]) {
                        bandLabel = band.label;
                    }
                }
            }
            computed[key] = { value: sum, label: bandLabel };
        }

        secondaryMetrics = computed;
    }

    return {
        totalScore: totalRawScore,
        totalPercent,
        level: currentLevel,
        areaScores,
        brakeApplied,
        brakeExplanationKey,
        answers, // Include raw answers for benchmarking
        secondaryMetrics,
    };
}
