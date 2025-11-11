'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppContext } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Target, PlusCircle, Trash2, PiggyBank, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const goalSchema = z.object({
  name: z.string().min(1, "Nome da meta é obrigatório."),
  targetValue: z.coerce.number().min(1, "Valor desejado deve ser maior que zero."),
  duration: z.coerce.number().min(1, "Duração deve ser maior que zero."),
  unit: z.enum(['months', 'days', 'weeks', 'years']),
});

const contributionSchema = z.object({
    goalId: z.string().min(1, "Selecione uma meta."),
    value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
});

export default function MetasPage() {
  const { state, addGoal, deleteGoal, contributeToGoal } = useAppContext();

  const goalForm = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetValue: undefined, duration: undefined, unit: 'months' },
  });

  const contributionForm = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { goalId: '', value: undefined },
  });

  const onGoalSubmit = (values: z.infer<typeof goalSchema>) => {
    addGoal(values);
    goalForm.reset();
  };

  const onContributionSubmit = (values: z.infer<typeof contributionSchema>) => {
    contributeToGoal(values.goalId, values.value);
    contributionForm.reset();
  };
  
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Target className="h-6 w-6" /> Metas de Economia</h2>

      <Card>
        <CardHeader><CardTitle>Criar Nova Meta</CardTitle></CardHeader>
        <CardContent>
          <Form {...goalForm}>
            <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
              <FormField control={goalForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl><Input placeholder="Ex: Viagem para a praia" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={goalForm.control} name="targetValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Desejado</FormLabel>
                  <FormControl><Input type="number" placeholder="R$ 0,00" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-4">
                <FormField control={goalForm.control} name="duration" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Duração</FormLabel>
                    <FormControl><Input type="number" placeholder="Ex: 12" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={goalForm.control} name="unit" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Prazo em</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="months">Meses</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="weeks">Semanas</SelectItem>
                        <SelectItem value="years">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Criar Meta e Plano</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {state.goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-accent"/> Guardar para Meta</CardTitle></CardHeader>
          <CardContent>
            <Form {...contributionForm}>
              <form onSubmit={contributionForm.handleSubmit(onContributionSubmit)} className="space-y-4">
                <FormField control={contributionForm.control} name="goalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecionar Meta</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Escolha uma meta..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {state.goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.name} ({formatCurrency(goal.targetValue - goal.saved)} restantes)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={contributionForm.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor a Guardar</FormLabel>
                    <FormControl><Input type="number" placeholder="R$ 0,00" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" variant="secondary">Guardar Valor</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold text-primary mt-6 mb-2">Metas Ativas</h3>
        <div className="space-y-4">
          {state.goals.length > 0 ? state.goals.map(goal => {
            const progress = (goal.saved / goal.targetValue) * 100;
            return (
              <Card key={goal.id} className="relative">
                <CardContent className="pt-6">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="font-bold text-primary">🎯 {goal.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">Plano: {formatCurrency(goal.monthlyCommitment)} / mês ({goal.monthsInPlan.toFixed(1)} meses)</p>
                  <Progress value={progress} className="mt-3 h-2" />
                  <p className="text-xs text-right text-muted-foreground mt-1">
                    {formatCurrency(goal.saved)} de {formatCurrency(goal.targetValue)} ({progress.toFixed(0)}%)
                  </p>
                </CardContent>
              </Card>
            )
          }) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Nenhuma meta de economia ativa.</AlertTitle>
              <AlertDescription>Crie uma para começar a planejar seu futuro!</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
