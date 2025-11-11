'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '@/contexts/app-context';
import { isSameMonth, formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Palette, BarChart3, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { hslToHex } from '@/lib/colors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';


export default function RelatoriosPage() {
  const { state, getCatColor, saveCustomColors } = useAppContext();
  const [reportMonth, setReportMonth] = useState(new Date());
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [customColors, setCustomColors] =useState<{category: string; color: string}[]>([]);

  const changeReportMonth = (offset: number) => {
    setReportMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };
  
  const { expenseData, revenueData } = useMemo(() => {
    const filteredDespesas = state.despesas.filter(d => isSameMonth(new Date(d.vencimento), reportMonth));
    const filteredGanhos = state.ganhos.filter(g => isSameMonth(new Date(g.data), reportMonth));

    const expenseCategoryTotals = filteredDespesas.reduce((acc, item) => {
      const cat = item.categoria || 'Não Classificado';
      acc[cat] = (acc[cat] || 0) + item.valor;
      return acc;
    }, {} as Record<string, number>);

    const revenueCategoryTotals = filteredGanhos.reduce((acc, item) => {
      const cat = item.categoria || 'Não Classificado';
      acc[cat] = (acc[cat] || 0) + item.valor;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      expenseData: Object.entries(expenseCategoryTotals).map(([name, value]) => ({ name, value, fill: hslToHex(getCatColor(name, false)) })),
      revenueData: Object.entries(revenueCategoryTotals).map(([name, value]) => ({ name, value, fill: hslToHex(getCatColor(name, true)) })),
    };
  }, [state.despesas, state.ganhos, reportMonth, getCatColor]);

  const openColorModal = () => {
    const despesaCats = [...new Set(state.despesas.map(d => d.categoria || 'Não Classificado'))];
    const ganhoCats = [...new Set(state.ganhos.map(g => g.categoria || 'Não Classificado'))];
    const allCats = [...new Set([...despesaCats, ...ganhoCats])];
    
    setCustomColors(allCats.map(cat => ({
      category: cat,
      color: hslToHex(getCatColor(cat, ganhoCats.includes(cat) && !despesaCats.includes(cat)))
    })));
    setIsColorModalOpen(true);
  };

  const handleColorChange = (category: string, color: string) => {
    setCustomColors(prev => prev.map(c => c.category === category ? { ...c, color } : c));
  };
  
  const handleSaveChanges = () => {
    saveCustomColors(customColors);
    setIsColorModalOpen(false);
  };

  const chartConfig = {};

  const noData = expenseData.length === 0 && revenueData.length === 0;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-primary flex items-center gap-2">
        <BarChart3 className="h-6 w-6" /> Relatórios
      </h2>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeReportMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-center w-32 capitalize">
                {reportMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeReportMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={openColorModal}>
              <Palette className="h-4 w-4 mr-2" /> Cores
            </Button>
          </div>
        </CardHeader>

        {noData ? (
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Não há lançamentos para o mês de {reportMonth.toLocaleDateString('pt-BR', { month: 'long' })}.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <CardContent className="space-y-8">
            {expenseData.length > 0 && (
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive mb-2">
                  <TrendingDown className="h-5 w-5" /> Despesas por Categoria
                </CardTitle>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel formatter={(value) => formatCurrency(Number(value))} />} />
                    <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                      {expenseData.map((entry) => ( <Cell key={`cell-${entry.name}`} fill={entry.fill} /> ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </div>
            )}

            {revenueData.length > 0 && (
               <div>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="h-5 w-5" /> Ganhos por Categoria
                </CardTitle>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel formatter={(value) => formatCurrency(Number(value))} />} />
                    <Pie data={revenueData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                      {revenueData.map((entry) => ( <Cell key={`cell-${entry.name}`} fill={entry.fill} /> ))}
                    </Pie>
                     <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Personalizar Cores das Categorias</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4 space-y-4">
            {customColors.length > 0 ? customColors.map(({ category, color }) => (
              <div key={category} className="flex items-center justify-between">
                <Label htmlFor={`color-${category}`}>{category}</Label>
                <Input
                  id={`color-${category}`}
                  type="color"
                  value={color}
                  className="w-12 h-8 p-1"
                  onChange={(e) => handleColorChange(category, e.target.value)}
                />
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria encontrada.</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
            <Button onClick={handleSaveChanges}>Salvar Cores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
