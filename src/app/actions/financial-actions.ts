'use server';
import { generateFinancialInsights, type GenerateFinancialInsightsInput } from '@/ai/flows/generate-financial-insights';

export async function getFinancialInsightsAction(input: GenerateFinancialInsightsInput) {
  try {
    const result = await generateFinancialInsights(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao gerar insights financeiros:", error);
    return { success: false, error: "Falha ao gerar os insights. Tente novamente mais tarde." };
  }
}
