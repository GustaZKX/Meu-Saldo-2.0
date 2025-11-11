'use server';

/**
 * @fileOverview Generates financial insights based on user data.
 *
 * This file defines a Genkit flow that analyzes user's financial data (ganhos, despesas, goals) to provide personalized insights,
 * including spending limits and goal progress tracking. The flow uses a prompt to generate human-readable insights.
 *
 * @interface GenerateFinancialInsightsInput - Defines the input schema for the flow, including lists of ganhos, despesas, and goals.
 * @interface GenerateFinancialInsightsOutput - Defines the output schema for the flow, which includes a list of financial insights.
 * @function generateFinancialInsights - The main function to trigger the financial insights generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialTransactionSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.string(),
  valor: z.number(),
  data: z.string().optional(),
  vencimento: z.string().optional(),
  pago: z.boolean().optional(),
  isRevenue: z.boolean(),
});

const FinancialGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetValue: z.number(),
  monthlyCommitment: z.number(),
  saved: z.number(),
  monthsInPlan: z.number(),
});

const GenerateFinancialInsightsInputSchema = z.object({
  ganhos: z.array(FinancialTransactionSchema),
  despesas: z.array(FinancialTransactionSchema),
  goals: z.array(FinancialGoalSchema),
});

export type GenerateFinancialInsightsInput = z.infer<
  typeof GenerateFinancialInsightsInputSchema
>;

const FinancialInsightSchema = z.string();

const GenerateFinancialInsightsOutputSchema = z.object({
  insights: z.array(FinancialInsightSchema),
});

export type GenerateFinancialInsightsOutput = z.infer<
  typeof GenerateFinancialInsightsOutputSchema
>;

export async function generateFinancialInsights(
  input: GenerateFinancialInsightsInput
): Promise<GenerateFinancialInsightsOutput> {
  return generateFinancialInsightsFlow(input);
}

const analyzeFinancialData = ai.defineTool({
  name: 'analyzeFinancialData',
  description: 'Analisa dados financeiros do usuário para fornecer insights sobre limites de gastos e progresso de metas.',
  inputSchema: GenerateFinancialInsightsInputSchema,
  outputSchema: z.object({
    dailySpendingLimit: z.number().describe('Limite de gastos diários.'),
    weeklySpendingLimit: z.number().describe('Limite de gastos semanal.'),
    goalProgressSummary: z.string().describe('Sumário do progresso das metas.'),
  }),
  async (input) => {
    const totalReceitas = input.ganhos.reduce((sum, g) => sum + g.valor, 0);
    const totalPagos = input.despesas
      .filter(d => d.pago)
      .reduce((sum, d) => sum + d.valor, 0);
    const totalDespesas = input.despesas.reduce((sum, d) => sum + d.valor, 0);
    const despesasPendentes = input.despesas
      .filter(d => !d.pago)
      .reduce((sum, d) => sum + d.valor, 0);

    const saldoRestante = totalReceitas - totalPagos;

    const today = new Date();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    const daysRemaining = Math.ceil(
      (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dailySpendingLimit = daysRemaining > 0 ? (saldoRestante - despesasPendentes) / daysRemaining : 0;
    const weeklySpendingLimit = dailySpendingLimit * 7;

    const totalGoalCommitment = input.goals.reduce(
      (sum, goal) => sum + goal.monthlyCommitment,
      0
    );

    const goalProgressSummary = `Você está comprometido a economizar ${totalGoalCommitment.toFixed(2)} mensalmente para suas metas.`;

    return {
      dailySpendingLimit,
      weeklySpendingLimit,
      goalProgressSummary,
    };
  },
});

const insightsPrompt = ai.definePrompt({
  name: 'insightsPrompt',
  input: GenerateFinancialInsightsInputSchema,
  output: {
    schema: GenerateFinancialInsightsOutputSchema,
  },
  tools: [analyzeFinancialData],
  prompt: `Você é um consultor financeiro pessoal especializado em fornecer insights financeiros acionáveis. Analise os dados financeiros fornecidos e forneça insights concisos e práticos sobre como o usuário pode melhorar sua saúde financeira. Inclua sugestões sobre limites de gastos e o progresso em relação às metas de economia. Use a ferramenta analyzeFinancialData para obter os limites de gastos. O seu output deve estar em português.

Ganhos:{{#each ganhos}}{{\n}}  - {{this.nome}} ({{this.valor}}){{/each}}
Despesas:{{#each despesas}}{{\n}}  - {{this.nome}} ({{this.valor}}){{/each}}
Metas:{{#each goals}}{{\n}}  - {{this.name}} ({{this.targetValue}}){{/each}}`,
});

const generateFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'generateFinancialInsightsFlow',
    inputSchema: GenerateFinancialInsightsInputSchema,
    outputSchema: GenerateFinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await insightsPrompt(input);
    return output!;
  }
);
