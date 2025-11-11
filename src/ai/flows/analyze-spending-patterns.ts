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
  essentialExpensesPercentage: z
    .number()
    .describe(
      'The percentage of total expenses that are considered essential (e.g., rent, utilities, groceries).' + 
      'Must be a value between 0 and 100.'
    ),
  discretionaryExpensesPercentage: z
    .number()
    .describe(
      'The percentage of total expenses that are considered discretionary (e.g., entertainment, dining out, hobbies).' + 
      'Must be a value between 0 and 100.'
    ),
  debtsPercentage: z
    .number()
    .describe(
      'The percentage of total income dedicated to debt payments (e.g., credit cards, loans).' + 
      'Must be a value between 0 and 100.'
    ),
  savingsGoalPercentage: z
    .number()
    .describe(
      'The percentage of total income the user wants to save each month.' + 
      'Must be a value between 0 and 100.'
    ),
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
  prompt: `You are a personal finance advisor. Analyze the user's spending patterns and provide personalized spending limit suggestions based on the data provided. Consider the percentages provided to generate accurate and helpful advice.

User's Financial Data:
Total Income: {{{totalIncome}}}
Total Expenses: {{{totalExpenses}}}
Essential Expenses Percentage: {{{essentialExpensesPercentage}}}%
Discretionary Expenses Percentage: {{{discretionaryExpensesPercentage}}}%
Debts Percentage: {{{debtsPercentage}}}%
Savings Goal Percentage: {{{savingsGoalPercentage}}}%

Based on this information, suggest a daily and weekly spending limit, and provide personalized advice. Take into account the user's desire to optimize their spending.

Daily Spending Limit:
Weekly Spending Limit:
Spending Advice: `,
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
