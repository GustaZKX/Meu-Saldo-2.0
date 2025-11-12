'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppContext } from '@/contexts/app-context';
import { Ganho, Despesa } from '@/lib/types';
import { formatCurrency, isSameMonth } from '@/lib/utils';
import { Pencil, PlusCircle, Trash2, TrendingDown, TrendingUp, X, Bell } from 'lucide-react';
import { format } from 'date-fns';

type FormState<T> = Partial<T> | null;

const alarmOptions = [
  { days: 7, label: '7 dias antes' },
  { days: 5, label: '5 dias antes' },
  { days: 3, label: '3 dias antes' },
  { days: 1, label: '1 dia antes' },
  { days: 0, label: 'No dia' },
];

export default function ContasPage() {
  const { state, addGanho, editGanho, deleteGanho, addDespesa, editDespesa, deleteDespesa } = useAppContext();
  
  const [ganhoForm, setGanhoForm] = useState<FormState<Ganho>>(null);
  const [despesaForm, setDespesaForm] = useState<FormState<Despesa>>(null);
  const [currentMonth] = useState(new Date());

  const handleGanhoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    const newGanho = {
      id: ganhoForm?.id || Date.now().toString(),
      nome: data.get('nome') as string,
      categoria: data.get('categoria') as string,
      valor: parseFloat(data.get('valor') as string),
      data: data.get('data') as string || format(new Date(), 'yyyy-MM-dd'),
    };

    if (!newGanho.nome || !newGanho.categoria || isNaN(newGanho.valor) || newGanho.valor <= 0) {
      return;
    }

    if (ganhoForm?.id) {
      editGanho(newGanho as Ganho);
    } else {
      addGanho(newGanho);
    }
    setGanhoForm(null);
    form.reset();
  };

  const handleDespesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    const alarmSettings: number[] = [];
    alarmOptions.forEach(opt => {
      if (data.get(`alarm-${opt.days}`) === 'on') {
        alarmSettings.push(opt.days);
      }
    });

    const newDespesa: Omit<Despesa, 'id' | 'isRevenue'> = {
      nome: data.get('nome') as string,
      categoria: data.get('categoria') as string,
      valor: parseFloat(data.get('valor') as string),
      vencimento: data.get('vencimento') as string,
      recorrencia: data.get('recorrencia') as 'mensal' | 'unico',
      pago: data.get('pago') === 'on',
      alarmSettings,
    };

    if (!newDespesa.nome || !newDespesa.categoria || isNaN(newDespesa.valor) || newDespesa.valor <= 0 || !newDespesa.vencimento) {
      return;
    }

    if (despesaForm?.id) {
      editDespesa({ ...newDespesa, id: despesaForm.id } as Despesa);
    } else {
      addDespesa(newDespesa);
    }
    setDespesaForm(null);
    form.reset();
  };

  const ganhosDoMes = state.ganhos.filter(g => isSameMonth(new Date(g.data.replace(/-/g, '\/')), currentMonth));
  const despesasDoMes = state.despesas.filter(d => isSameMonth(new Date(d.vencimento.replace(/-/g, '\/')), currentMonth));

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        Gerenciar Contas
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ganhos */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center justify-between">
              {ganhoForm ? 'Editar Ganho' : 'Adicionar Ganho'}
              <TrendingUp className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGanhoSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ganho-nome">Nome do Ganho</Label>
                <Input id="ganho-nome" name="nome" required placeholder="Ex: Salário" defaultValue={ganhoForm?.nome} />
              </div>
              <div>
                <Label htmlFor="ganho-cat">Classificação</Label>
                <Input id="ganho-cat" name="categoria" required placeholder="Ex: Renda Fixa" defaultValue={ganhoForm?.categoria} />
              </div>
              <div>
                <Label htmlFor="ganho-valor">Valor</Label>
                <Input id="ganho-valor" name="valor" type="number" required placeholder="R$ 0,00" step="0.01" min="0.01" defaultValue={ganhoForm?.valor} />
              </div>
              <div>
                <Label htmlFor="ganho-data">Data</Label>
                <Input id="ganho-data" name="data" type="date" defaultValue={ganhoForm?.data || format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="flex gap-2">
                {ganhoForm && <Button type="button" variant="outline" onClick={() => setGanhoForm(null)}><X className="mr-2 h-4 w-4"/> Cancelar</Button>}
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  {ganhoForm ? <Pencil className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                  {ganhoForm ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
            <div className="mt-6">
              <h4 className="font-semibold text-green-800 mb-2">Ganhos do Mês</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {ganhosDoMes.length > 0 ? ganhosDoMes.map(g => (
                  <div key={g.id} className="text-sm flex justify-between items-center bg-white p-2 rounded-md border">
                    <div>
                      <p className="font-medium">{g.nome}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(g.valor)} - {g.categoria}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setGanhoForm(g)}><Pencil className="h-4 w-4 text-blue-600"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGanho(g.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground p-3 bg-green-100/50 rounded-md">Nenhum ganho neste mês.</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              {despesaForm ? 'Editar Despesa' : 'Adicionar Despesa'}
              <TrendingDown className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDespesaSubmit} className="space-y-4">
              <div>
                <Label htmlFor="despesa-nome">Nome da Despesa</Label>
                <Input id="despesa-nome" name="nome" required placeholder="Ex: Aluguel" defaultValue={despesaForm?.nome} />
              </div>
              <div>
                <Label htmlFor="despesa-cat">Classificação</Label>
                <Input id="despesa-cat" name="categoria" required placeholder="Ex: Moradia" defaultValue={despesaForm?.categoria} />
              </div>
              <div>
                <Label htmlFor="despesa-valor">Valor</Label>
                <Input id="despesa-valor" name="valor" type="number" required placeholder="R$ 0,00" step="0.01" min="0.01" defaultValue={despesaForm?.valor} />
              </div>
              <div>
                <Label htmlFor="despesa-venc">Vencimento</Label>
                <Input id="despesa-venc" name="vencimento" type="date" required defaultValue={despesaForm?.vencimento ? format(new Date(despesaForm.vencimento.replace(/-/g, '/')), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} />
              </div>
              
              <div className="space-y-2">
                <Label>Esta despesa é:</Label>
                <RadioGroup name="recorrencia" defaultValue={despesaForm?.recorrencia || 'unico'} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unico" id="r-unico" />
                    <Label htmlFor="r-unico" className="font-normal">Apenas este mês</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mensal" id="r-mensal" />
                    <Label htmlFor="r-mensal" className="font-normal">Mensal</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Bell className="h-4 w-4" /> Avisar sobre o vencimento</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {alarmOptions.map(opt => (
                    <div key={opt.days} className="flex items-center gap-2">
                      <Checkbox 
                        id={`alarm-${opt.days}`} 
                        name={`alarm-${opt.days}`} 
                        key={despesaForm?.id ? `${despesaForm.id}-alarm-${opt.days}` : `new-alarm-${opt.days}`}
                        defaultChecked={despesaForm?.alarmSettings?.includes(opt.days)}
                      />
                      <Label htmlFor={`alarm-${opt.days}`} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="despesa-pago" name="pago" key={despesaForm?.id ? `${despesaForm.id}-pago` : 'new-pago'} defaultChecked={despesaForm?.pago} />
                <Label htmlFor="despesa-pago" className="font-normal">Marcar como pago</Label>
              </div>

              <div className="flex gap-2">
                {despesaForm && <Button type="button" variant="outline" onClick={() => setDespesaForm(null)}><X className="mr-2 h-4 w-4"/> Cancelar</Button>}
                <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90">
                  {despesaForm ? <Pencil className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                  {despesaForm ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
            <div className="mt-6">
              <h4 className="font-semibold text-red-800 mb-2">Despesas do Mês</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {despesasDoMes.length > 0 ? despesasDoMes.map(d => (
                  <div key={d.id} className={`text-sm flex justify-between items-center bg-white p-2 rounded-md border ${d.pago ? 'opacity-60' : ''}`}>
                    <div>
                      <p className={`font-medium ${d.pago ? 'line-through' : ''}`}>{d.nome}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(d.valor)} - {d.categoria}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDespesaForm(d)}><Pencil className="h-4 w-4 text-blue-600"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDespesa(d.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground p-3 bg-red-100/50 rounded-md">Nenhuma despesa neste mês.</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
