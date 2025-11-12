'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Ganho, Despesa, Goal, User, ColorCache } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getConsistentColor, hexToHsl } from '@/lib/colors';
import { addMonths, format } from 'date-fns';

const LOCAL_STORAGE_KEY = 'meuSaldoData';
const LOCAL_COLOR_KEY = 'meuSaldoColors';

interface AppState {
  ganhos: Ganho[];
  despesas: Despesa[];
  goals: Goal[];
  user: User;
  colorCache: ColorCache;
}

interface AppContextType {
  state: AppState;
  isLoaded: boolean;
  addGanho: (ganho: Omit<Ganho, 'id' | 'isRevenue'>) => void;
  editGanho: (ganho: Omit<Ganho, 'isRevenue'>) => void;
  deleteGanho: (id: string) => void;
  addDespesa: (despesa: Omit<Despesa, 'id' | 'isRevenue'>) => void;
  editDespesa: (despesa: Omit<Despesa, 'isRevenue'>) => void;
  deleteDespesa: (id: string) => void;
  toggleExpensePaid: (id: string, currentStatus: boolean) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'saved' | 'monthlyCommitment' | 'monthsInPlan'> & { duration: number, unit: 'days' | 'weeks' | 'months' | 'years'}) => void;
  contributeToGoal: (goalId: string, value: number) => void;
  deleteGoal: (id: string) => void;
  updateUsername: (username: string) => void;
  resetApp: () => void;
  saveCustomColors: (colors: {category: string, color: string}[]) => void;
  getCatColor: (category: string, isRevenue: boolean) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  ganhos: [],
  despesas: [],
  goals: [],
  user: { username: "Usuário" },
  colorCache: {},
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const storedColors = localStorage.getItem(LOCAL_COLOR_KEY);
      
      let loadedState = { ...initialState };

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        loadedState = {
          ...loadedState,
          ganhos: parsedData.ganhos || [],
          despesas: parsedData.despesas || [],
          goals: parsedData.goals || [],
          user: { username: parsedData.username || "Usuário" },
        }
      }
      if(storedColors) {
        loadedState.colorCache = JSON.parse(storedColors);
      }
      setState(loadedState);
    } catch (error) {
      console.error("Falha ao carregar dados do LocalStorage", error);
      toast({ title: "Erro", description: "Não foi possível carregar seus dados.", variant: 'destructive' });
    }
    setIsLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (isLoaded) {
      try {
        const dataToStore = {
          ganhos: state.ganhos,
          despesas: state.despesas,
          goals: state.goals,
          username: state.user.username
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
        localStorage.setItem(LOCAL_COLOR_KEY, JSON.stringify(state.colorCache));
      } catch (error) {
        console.error("Falha ao salvar dados no LocalStorage", error);
        toast({ title: "Erro", description: "Não foi possível salvar seus dados.", variant: 'destructive' });
      }
    }
  }, [state, isLoaded, toast]);

  const addGanho = useCallback((ganho: Omit<Ganho, 'id' | 'isRevenue'>) => {
    const newGanho: Ganho = { ...ganho, id: Date.now().toString(), isRevenue: true };
    setState(prev => ({ ...prev, ganhos: [...prev.ganhos, newGanho] }));
    toast({ title: "Sucesso", description: "Ganho adicionado!" });
  }, [toast]);

  const editGanho = useCallback((ganho: Omit<Ganho, 'isRevenue'>) => {
    setState(prev => ({ ...prev, ganhos: prev.ganhos.map(g => g.id === ganho.id ? { ...ganho, isRevenue: true } : g) }));
    toast({ title: "Sucesso", description: "Ganho atualizado!" });
  }, [toast]);

  const deleteGanho = useCallback((id: string) => {
    setState(prev => ({ ...prev, ganhos: prev.ganhos.filter(g => g.id !== id) }));
    toast({ title: "Sucesso", description: "Ganho excluído." });
  }, [toast]);

  const addDespesa = useCallback((despesa: Omit<Despesa, 'id' | 'isRevenue'>) => {
    let newDespesas: Despesa[] = [];
    const baseId = Date.now();

    if (despesa.recorrencia === 'mensal') {
      for (let i = 0; i < 12; i++) { // Adiciona para os próximos 12 meses
        const vencimentoDate = new Date(despesa.vencimento + 'T12:00:00');
        const newVencimento = addMonths(vencimentoDate, i);
        newDespesas.push({
          ...despesa,
          id: `${baseId}-${i}`,
          isRevenue: false,
          vencimento: format(newVencimento, 'yyyy-MM-dd'),
          pago: false,
        });
      }
    } else {
      newDespesas.push({ ...despesa, id: baseId.toString(), isRevenue: false });
    }
    
    setState(prev => ({
      ...prev,
      despesas: [...prev.despesas, ...newDespesas].sort((a,b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())
    }));

    const message = despesa.recorrencia === 'mensal' ? 'Despesa mensal adicionada para o próximo ano.' : 'Despesa adicionada!';
    toast({ title: "Sucesso", description: message });
  }, [toast]);


  const editDespesa = useCallback((despesa: Omit<Despesa, 'isRevenue'>) => {
    setState(prev => ({ ...prev, despesas: prev.despesas.map(d => d.id === despesa.id ? { ...despesa, isRevenue: false } : d).sort((a,b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()) }));
    toast({ title: "Sucesso", description: "Despesa atualizada!" });
  }, [toast]);

  const deleteDespesa = useCallback((id: string) => {
    setState(prev => ({ ...prev, despesas: prev.despesas.filter(d => d.id !== id) }));
    toast({ title: "Sucesso", description: "Despesa excluída." });
  }, [toast]);

  const toggleExpensePaid = useCallback((id: string, currentStatus: boolean) => {
    setState(prev => ({
      ...prev,
      despesas: prev.despesas.map(d => d.id === id ? { ...d, pago: !currentStatus } : d)
    }));
    toast({ title: "Sucesso", description: currentStatus ? "Pagamento desmarcado." : "Conta marcada como paga!" });
  }, [toast]);

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'saved' | 'monthlyCommitment' | 'monthsInPlan'> & { duration: number, unit: 'days' | 'weeks' | 'months' | 'years'}) => {
    const { duration, unit, ...rest } = goalData;
    let monthsInPlan: number;
    switch (unit) {
      case 'days': monthsInPlan = duration / 30.44; break;
      case 'weeks': monthsInPlan = duration / 4.345; break;
      case 'years': monthsInPlan = duration * 12; break;
      default: monthsInPlan = duration;
    }
    const monthlyCommitment = goalData.targetValue / monthsInPlan;
    
    const newGoal: Goal = {
      ...rest,
      id: Date.now().toString(),
      saved: 0,
      monthsInPlan,
      monthlyCommitment
    };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    toast({ title: "Sucesso", description: `Meta "${newGoal.name}" criada!` });
  }, [toast]);

  const contributeToGoal = useCallback((goalId: string, value: number) => {
    setState(prev => {
      let goalName = '';
      const newGoals = prev.goals.map(g => {
        if (g.id === goalId) {
          goalName = g.name;
          const newSavedValue = g.saved + value;
          if(newSavedValue >= g.targetValue) {
            toast({ title: "Parabéns!", description: `Meta "${g.name}" atingida!` });
            return { ...g, saved: g.targetValue };
          }
          return { ...g, saved: newSavedValue };
        }
        return g;
      });
      if(goalName) toast({ title: "Sucesso", description: `Valor adicionado à meta "${goalName}"` });
      return { ...prev, goals: newGoals };
    });
  }, [toast]);

  const deleteGoal = useCallback((id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    toast({ title: "Sucesso", description: "Meta excluída." });
  }, [toast]);

  const updateUsername = useCallback((username: string) => {
    setState(prev => ({ ...prev, user: { ...prev.user, username } }));
    toast({ title: "Sucesso", description: "Nome de usuário atualizado!" });
  }, [toast]);

  const resetApp = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_COLOR_KEY);
    setState(initialState);
    toast({ title: "Aplicativo Resetado", description: "Todos os dados foram apagados." });
    // A recarga da página pode ser feita no componente que chama
    window.location.reload();
  }, [toast]);

  const saveCustomColors = useCallback((colors: {category: string, color: string}[]) => {
      setState(prev => {
          const newColorCache = { ...prev.colorCache };
          colors.forEach(item => {
              const cacheKey = item.category.toLowerCase();
              newColorCache[cacheKey] = {
                  color: hexToHsl(item.color),
                  custom: true
              };
          });
          return { ...prev, colorCache: newColorCache };
      });
      toast({ title: 'Sucesso', description: 'Cores personalizadas salvas!' });
  }, [toast]);

  const getCatColor = useCallback((category: string, isRevenue: boolean): string => {
      return getConsistentColor(category, isRevenue, state.colorCache);
  }, [state.colorCache]);

  const value = {
    state,
    isLoaded,
    addGanho,
    editGanho,
    deleteGanho,
    addDespesa,
    editDespesa,
    deleteDespesa,
    toggleExpensePaid,
    addGoal,
    contributeToGoal,
    deleteGoal,
    updateUsername,
    resetApp,
    saveCustomColors,
    getCatColor,
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
