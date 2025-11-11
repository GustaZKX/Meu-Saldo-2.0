'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { getFinancialInsightsAction } from '@/app/actions/financial-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Info, Loader2, Sparkles, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { GenerateFinancialInsightsOutput } from '@/ai/flows/generate-financial-insights';

export default function ContadoraPage() {
  const { state } = useAppContext();
  const [insights, setInsights] = useState<GenerateFinancialInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ganhos, despesas, goals } = state;

  const memoizedInput = useMemo(() => ({
    ganhos: ganhos.map(g => ({ ...g, data: g.data.toString() })),
    despesas: despesas.map(d => ({ ...d, vencimento: d.vencimento.toString()})),
    goals: goals,
  }), [ganhos, despesas, goals]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (memoizedInput.ganhos.length === 0 && memoizedInput.despesas.length === 0) {
        setInsights(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const result = await getFinancialInsightsAction(memoizedInput);
        if (result.success) {
          setInsights(result.data);
        } else {
          setError(result.error || 'Ocorreu um erro desconhecido.');
        }
      } catch (e) {
        setError('Falha ao comunicar com o serviço de IA.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [memoizedInput]);

  const totalGoalCommitment = state.goals.reduce((sum, goal) => sum + goal.monthlyCommitment, 0);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Erro ao Gerar Insights</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!insights || insights.insights.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Faltam Dados</AlertTitle>
          <AlertDescription>
            Adicione seus ganhos e despesas na aba 'Contas' para que nossa IA possa gerar orientações para você.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-4">
        {insights.insights.map((insight, index) => (
          <Card key={index} className="bg-blue-50 border-blue-200">
            <CardHeader className='pb-2'>
              <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Insight da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{insight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-primary flex items-center justify-center gap-2">
          <Bot className="h-6 w-6" />
          Contadora IA
        </h2>
        <p className="text-muted-foreground text-sm">Sua orientação financeira inteligente.</p>
      </div>
      
      <Alert className="bg-background">
        <Info className="h-4 w-4" />
        <AlertTitle>Como Funciona?</AlertTitle>
        <AlertDescription>
          Os cálculos abaixo são gerados por nossa IA com base nos seus lançamentos na aba 'Contas' e são atualizados em tempo real.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        {renderContent()}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary mt-8 mb-4 border-b pb-2 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Planejamento de Metas
        </h3>
        {state.goals.length > 0 ? (
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-800">Compromisso Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Valor a ser reservado mensalmente para suas metas:</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGoalCommitment)}</p>
              </CardContent>
            </Card>

            {state.goals.map(goal => (
              <Card key={goal.id} className="text-sm">
                <CardContent className="pt-4">
                  <p className="font-bold">🎯 {goal.name}</p>
                  <p className="text-muted-foreground">Reservar: <span className="font-medium text-green-600">{formatCurrency(goal.monthlyCommitment)}/mês</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhuma Meta Ativa</AlertTitle>
            <AlertDescription>Crie uma meta na aba 'Metas' para receber orientações financeiras.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
