import { useState, useCallback, useMemo, useEffect } from 'react';
import { Question, QuestionnaireData } from '../types';

export function useQuestionnaire(data: QuestionnaireData) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [enabledBlocks, setEnabledBlocks] = useState<Set<string>>(new Set(['S0', 'S1', 'SA', 'SB', 'SC', 'SD', 'SE', 'SF', 'SX']));

    // Load from localStorage on init
    useEffect(() => {
        const saved = localStorage.getItem('ai-survey-state');
        if (saved) {
            try {
                const { currentQuestionIndex, answers, enabledBlocks } = JSON.parse(saved);
                setCurrentQuestionIndex(currentQuestionIndex);
                setAnswers(answers);
                setEnabledBlocks(new Set(enabledBlocks));
            } catch (e) {
                console.error('Failed to load saved state');
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('ai-survey-state', JSON.stringify({
            currentQuestionIndex,
            answers,
            enabledBlocks: Array.from(enabledBlocks)
        }));
    }, [currentQuestionIndex, answers, enabledBlocks]);

    // Filter questions based on enabled blocks
    const visibleQuestions = useMemo(() => {
        return data.questions.filter(q => enabledBlocks.has(q.section));
    }, [data.questions, enabledBlocks]);

    const currentQuestion = visibleQuestions[currentQuestionIndex];

    const handleAnswer = useCallback((questionId: string, answer: any) => {
        setAnswers(prev => {
            const nextAnswers = { ...prev, [questionId]: answer };

            // Handle branching logic
            const question = data.questions.find(q => q.id === questionId);
            if (question?.logic?.branch_rules) {
                const nextBlocks = new Set(enabledBlocks);

                // Reset dynamic blocks first? Or based on current answer?
                // Rules specify "then_enable_blocks"
                question.logic.branch_rules.forEach(rule => {
                    const isSelected = Array.isArray(answer)
                        ? answer.some(val => rule.if_any_selected.includes(val))
                        : rule.if_any_selected.includes(answer);

                    if (isSelected) {
                        rule.then_enable_blocks.forEach(block => nextBlocks.add(block));
                    } else {
                        // If none of the selected options trigger this rule, we should check if another rule enables it
                        // Simple approach: if not selected, remove it UNLESS another rule triggers it (complex)
                        // Better: re-evaluate all rules for this question
                    }
                });

                // Re-evaluate all rules for this question to be safe
                const allDynamicBlocksInQuestion = question.logic.branch_rules.flatMap(r => r.then_enable_blocks);
                allDynamicBlocksInQuestion.forEach(block => nextBlocks.delete(block));

                question.logic.branch_rules.forEach(rule => {
                    const isSelected = Array.isArray(answer)
                        ? answer.some(val => rule.if_any_selected.includes(val))
                        : rule.if_any_selected.includes(answer);

                    if (isSelected) {
                        rule.then_enable_blocks.forEach(block => nextBlocks.add(block));
                    }
                });

                setEnabledBlocks(nextBlocks);
            }

            return nextAnswers;
        });
    }, [data.questions, enabledBlocks]);

    const next = useCallback(() => {
        if (currentQuestionIndex < visibleQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, visibleQuestions.length]);

    const back = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const progress = Math.round(((currentQuestionIndex + 1) / visibleQuestions.length) * 100);

    return {
        currentQuestion,
        currentQuestionIndex,
        totalQuestions: visibleQuestions.length,
        answers,
        handleAnswer,
        next,
        back,
        progress,
        isFirst: currentQuestionIndex === 0,
        isLast: currentQuestionIndex === visibleQuestions.length - 1,
        visibleQuestions
    };
}
