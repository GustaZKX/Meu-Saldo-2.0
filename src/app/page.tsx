'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useAppContext } from '@/contexts/app-context';
import { formatCurrency, isSameDay, isSameMonth } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, startOfDay } from 'date-fns';
import { Despesa } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Home() {
  const { state, toggleExpensePaid } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleMonthChange = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
    setSelectedDate(undefined);
  };

  // Financial Summary Calculation
  const ganhosMes = state.ganhos.filter(g => isSameMonth(new Date(g.data.replace(/-/g, '\/')), currentMonth));
  const despesasMes = state.despesas.filter(d => isSameMonth(new Date(d.vencimento.replace(/-/g, '\/')), currentMonth));
  
  const totalReceitas = ganhosMes.reduce((sum, g) => sum + g.valor, 0);
  const totalDespesas = despesasMes.reduce((sum, d) => sum + d.valor, 0);
  const totalPagos = despesasMes.filter(d => d.pago).reduce((sum, d) => sum + d.valor, 0);
  const saldoAtual = totalReceitas - totalPagos;

  // Calendar
  const datesWithDues = state.despesas
    .filter(d => !d.pago)
    .map(d => new Date(d.vencimento.replace(/-/g, '\/')));

  // Alarms
  const today = startOfDay(new Date());
  const dueAlarms: (Despesa & { daysUntilDue: number })[] = state.despesas
    .filter(d => {
      if (d.pago || !d.alarmSettings || d.alarmSettings.length === 0) return false;
      const dueDate = startOfDay(new Date(d.vencimento.replace(/-/g, '\/')));
      const daysUntilDue = differenceInDays(dueDate, today);
      if (daysUntilDue < 0) return false; // Ignore overdue
      return d.alarmSettings.includes(daysUntilDue);
    })
    .map(d => ({
      ...d,
      daysUntilDue: differenceInDays(startOfDay(new Date(d.vencimento.replace(/-/g, '\/'))), today)
    }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);


  const vencimentosDoDia = selectedDate ? state.despesas.filter(d => isSameDay(new Date(d.vencimento.replace(/-/g, '\/')), selectedDate) && !d.pago) : [];
  const vencimentosDoMes = state.despesas.filter(d => isSameMonth(new Date(d.vencimento.replace(/-/g, '\/')), currentMonth) && !d.pago).sort((a,b) => new Date(a.vencimento.replace(/-/g, '\/')).getTime() - new Date(b.vencimento.replace(/-/g, '\/')).getTime());

  const displayedVencimentos = selectedDate ? vencimentosDoDia : vencimentosDoMes.slice(0, 5);
  
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-primary">Finanças do Mês</h2>

      {dueAlarms.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
              <BellRing className="h-5 w-5 animate-pulse" /> Alertas de Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueAlarms.map(d => (
              <Alert key={`alarm-${d.id}`} variant="default" className="bg-amber-50 border-amber-200">
                <BellRing className="h-4 w-4 text-amber-600"/>
                <AlertTitle className="text-amber-800">{d.nome} - {formatCurrency(d.valor)}</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Vence {d.daysUntilDue === 0 ? 'hoje' : `em ${d.daysUntilDue} dia(s)`}!
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" /> Vencimentos e Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
              modifiers={{
                hasDue: datesWithDues,
              }}
              modifiersClassNames={{
                hasDue: 'has-due',
              }}
              className="p-0"
            />
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">{selectedDate ? `Contas do dia ${selectedDate.toLocaleDateString('pt-BR')}` : 'Próximos Vencimentos'}</h4>
              {displayedVencimentos.length > 0 ? (
                <div className="space-y-2">
                  {displayedVencimentos.map(d => {
                    const isVencido = !d.pago && new Date(d.vencimento.replace(/-/g, '\/')) < new Date() && !isSameDay(new Date(d.vencimento.replace(/-/g, '\/')), new Date());
                    return (
                      <div key={d.id} className={`text-sm p-2 rounded-md border-l-4 ${d.pago ? 'border-blue-400 bg-blue-50 opacity-70' : isVencido ? 'border-destructive bg-destructive/10' : 'border-amber-400 bg-amber-50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`font-medium ${isVencido ? 'text-destructive' : ''}`}>{d.nome} - {formatCurrency(d.valor)}</p>
                            <p className="text-xs text-muted-foreground">Vence: {new Date(d.vencimento.replace(/-/g, '\/')).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {!d.pago && (
                            <Button size="sm" variant={"default"} onClick={() => toggleExpensePaid(d.id, false)}>
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedDate ? 'Nenhuma conta para este dia.' : 'Nenhum vencimento neste mês.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" /> Controle Mensal
            </CardTitle>
            <CardDescription>Status atual das suas finanças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {(totalReceitas === 0 && totalDespesas === 0) && (
              <p className="text-center text-muted-foreground bg-muted p-3 rounded-md">Cadastre ganhos e despesas para ver o resumo.</p>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium">Entrou (Receitas Totais)</span>
              <span className="font-bold text-green-600 value receita">{formatCurrency(totalReceitas)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Saiu (Despesas Totais)</span>
              <span className="font-bold text-destructive value despesa">{formatCurrency(totalDespesas)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Pago (Despesas Liquidadas)</span>
              <span className="font-bold text-cyan-600 value pago">{formatCurrency(totalPagos)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-semibold text-base">Saldo Atual (Disponível)</span>
              <span className={`font-bold text-lg ${saldoAtual < 0 ? 'text-destructive' : 'text-primary'} value saldo`}>{formatCurrency(saldoAtual)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
