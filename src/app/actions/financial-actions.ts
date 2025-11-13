'use server';
import { analyzeSpendingPatterns, type AnalyzeSpendingPatternsInput } from '@/ai/flows/analyze-spending-patterns';

export async function getFinancialInsightsAction(input: AnalyzeSpendingPatternsInput) {
  try {
    const result = await analyzeSpendingPatterns(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao gerar insights financeiros:", error);
    const errorMessage = error.message || "Falha ao gerar os insights. Tente novamente mais tarde.";
    return { success: false, error: errorMessage };
  }
}
