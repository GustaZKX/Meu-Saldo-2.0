'use server';

/**
 * @fileOverview An AI agent that analyzes user spending patterns and provides personalized spending limit suggestions.
 *
 * - analyzeSpendingPatterns - A function that handles the analysis of spending patterns and returns spending limit suggestions.
 * - AnalyzeSpendingPatternsInput - The input type for the analyzeSpendingPatterns function.
 * - AnalyzeSpendingPatternsOutput - The return type for the analyzeSpendingPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSpendingPatternsInputSchema = z.object({
  totalIncome: z.number().describe('The total monthly income of the user.'),
  totalExpenses: z.number().describe('The total monthly expenses of the user.'),
  essentialExpenses: z.number().describe('The total amount of essential expenses (e.g., rent, utilities, groceries).'),
  discretionaryExpenses: z.number().describe('The total amount of discretionary expenses (e.g., entertainment, dining out, hobbies).'),
  savingsGoal: z.number().describe('The amount the user wants to save each month.'),
});
export type AnalyzeSpendingPatternsInput = z.infer<typeof AnalyzeSpendingPatternsInputSchema>;

const AnalyzeSpendingPatternsOutputSchema = z.object({
  dailySpendingLimit: z
    .number()
    .describe('The suggested daily spending limit to help the user stay within their budget.'),
  weeklySpendingLimit: z
    .number()
    .describe('The suggested weekly spending limit to help the user stay within their budget.'),
  spendingAdvice: z
    .string()
    .describe('Personalized advice on how to optimize spending based on the user data.'),
});
export type AnalyzeSpendingPatternsOutput = z.infer<typeof AnalyzeSpendingPatternsOutputSchema>;

export async function analyzeSpendingPatterns(
  input: AnalyzeSpendingPatternsInput
): Promise<AnalyzeSpendingPatternsOutput> {
  return analyzeSpendingPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpendingPatternsPrompt',
  input: {schema: AnalyzeSpendingPatternsInputSchema},
  output: {schema: AnalyzeSpendingPatternsOutputSchema},
  prompt: `You are a personal finance advisor. Your goal is to provide actionable advice to users based on their financial data. Analyze the user's spending patterns and provide personalized spending limit suggestions.

User's Financial Data:
- Total Income: {{{totalIncome}}}
- Total Expenses: {{{totalExpenses}}}
- Essential Expenses: {{{essentialExpenses}}}
- Discretionary Expenses: {{{discretionaryExpenses}}}
- Savings Goal: {{{savingsGoal}}}

Based on this information, calculate and suggest a daily and a weekly spending limit. Provide personalized advice on how the user can better manage their finances to meet their savings goals. The advice should be encouraging and practical. Your output must be in Portuguese.`,
});

const analyzeSpendingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeSpendingPatternsFlow',
    inputSchema: AnalyzeSpendingPatternsInputSchema,
    outputSchema: AnalyzeSpendingPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
