'use server';
import { analyzeSpendingPatterns, type AnalyzeSpendingPatternsInput } from '@/ai/flows/analyze-spending-patterns';

export async function getFinancialInsightsAction(input: AnalyzeSpendingPatternsInput) {
  try {
    const result = await analyzeSpendingPatterns(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao gerar insights financeiros:", error);
    return { success: false, error: "Falha ao gerar os insights. Tente novamente mais tarde." };
  }
}
