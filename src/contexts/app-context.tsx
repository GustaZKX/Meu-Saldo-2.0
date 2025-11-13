'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  toggleExpensePaid: (id: string) => void;
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
  const prevStateRef = useRef<AppState>(state);

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
      prevStateRef.current = loadedState;
    } catch (error) {
      console.error("Falha ao carregar dados do LocalStorage", error);
      toast({ title: "Erro", description: "Não foi possível carregar seus dados.", variant: 'destructive' });
    }
    setIsLoaded(true);
  }, []);

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
        
        // --- TOAST NOTIFICATIONS ---
        const prevState = prevStateRef.current;

        // Ganhos
        if (prevState.ganhos.length < state.ganhos.length) toast({ title: "Sucesso", description: "Ganho adicionado!" });
        if (prevState.ganhos.length > state.ganhos.length) toast({ title: "Sucesso", description: "Ganho excluído." });
        const editedGanho = state.ganhos.find(g => {
          const prevG = prevState.ganhos.find(pg => pg.id === g.id);
          return prevG && JSON.stringify(prevG) !== JSON.stringify(g);
        });
        if (editedGanho) toast({ title: "Sucesso", description: "Ganho atualizado!" });

        // Despesas
        if (prevState.despesas.length < state.despesas.length) {
            const addedExpense = state.despesas.find(d => !prevState.despesas.some(pd => pd.id === d.id));
            const message = addedExpense?.recorrencia === 'mensal' ? 'Despesa mensal adicionada para o próximo ano.' : 'Despesa adicionada!';
            toast({ title: "Sucesso", description: message });
        }
        if (prevState.despesas.length > state.despesas.length) toast({ title: "Sucesso", description: "Despesa excluída." });
        const editedDespesa = state.despesas.find(d => {
            const prevD = prevState.despesas.find(pd => pd.id === d.id);
            return prevD && JSON.stringify(prevD) !== JSON.stringify(d) && prevD.pago === d.pago; // Ignore pago toggle
        });
        if (editedDespesa) toast({ title: "Sucesso", description: "Despesa atualizada!" });
        const toggledDespesa = state.despesas.find(d => {
          const prevD = prevState.despesas.find(pd => pd.id === d.id);
          return prevD && prevD.pago !== d.pago;
        });
        if (toggledDespesa) {
          const message = toggledDespesa.pago ? "Conta marcada como paga!" : "Pagamento desmarcado.";
          toast({ title: "Sucesso", description: message });
        }

        // Metas
        if (prevState.goals.length < state.goals.length) {
            const newGoal = state.goals[state.goals.length - 1];
            toast({ title: "Sucesso", description: `Meta "${newGoal.name}" criada!` });
        }
        if (prevState.goals.length > state.goals.length) toast({ title: "Sucesso", description: "Meta excluída." });
        
        state.goals.forEach(currentGoal => {
          const prevGoal = prevState.goals.find(g => g.id === currentGoal.id);
          if (prevGoal && prevGoal.saved < currentGoal.saved) {
             toast({ title: "Sucesso", description: `Valor adicionado à meta "${currentGoal.name}"` });
             if (currentGoal.saved >= currentGoal.targetValue) {
               toast({ title: "Parabéns!", description: `Meta "${currentGoal.name}" atingida!` });
             }
          }
        });


        // Outros
        if (prevState.user.username !== state.user.username) toast({ title: "Sucesso", description: "Nome de usuário atualizado!" });
        if (JSON.stringify(prevState.colorCache) !== JSON.stringify(state.colorCache)) toast({ title: 'Sucesso', description: 'Cores personalizadas salvas!' });

        prevStateRef.current = state; // Update ref after all checks
      } catch (error) {
        console.error("Falha ao salvar dados no LocalStorage", error);
        toast({ title: "Erro", description: "Não foi possível salvar seus dados.", variant: 'destructive' });
      }
    }
  }, [state, isLoaded, toast]);

  const addGanho = useCallback((ganho: Omit<Ganho, 'id' | 'isRevenue'>) => {
    const newGanho: Ganho = { ...ganho, id: Date.now().toString(), isRevenue: true };
    setState(prev => ({ ...prev, ganhos: [...prev.ganhos, newGanho] }));
  }, []);

  const editGanho = useCallback((ganho: Omit<Ganho, 'isRevenue'>) => {
    setState(prev => ({ ...prev, ganhos: prev.ganhos.map(g => g.id === ganho.id ? { ...ganho, isRevenue: true } : g) }));
  }, []);

  const deleteGanho = useCallback((id: string) => {
    setState(prev => ({ ...prev, ganhos: prev.ganhos.filter(g => g.id !== id) }));
  }, []);

  const addDespesa = useCallback((despesa: Omit<Despesa, 'id' | 'isRevenue'>) => {
    let newDespesas: Despesa[] = [];
    const baseId = Date.now();

    if (despesa.recorrencia === 'mensal') {
      for (let i = 0; i < 12; i++) {
        const vencimentoDate = new Date(despesa.vencimento.replace(/-/g, '\/'));
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
  }, []);


  const editDespesa = useCallback((despesa: Omit<Despesa, 'isRevenue'>) => {
    setState(prev => ({ ...prev, despesas: prev.despesas.map(d => d.id === despesa.id ? { ...despesa, isRevenue: false } : d).sort((a,b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()) }));
  }, []);

  const deleteDespesa = useCallback((id: string) => {
    setState(prev => ({ ...prev, despesas: prev.despesas.filter(d => d.id !== id) }));
  }, []);

  const toggleExpensePaid = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      despesas: prev.despesas.map(d => 
        d.id === id ? { ...d, pago: !d.pago } : d
      ),
    }));
  }, []);

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
  }, []);

  const contributeToGoal = useCallback((goalId: string, value: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id === goalId) {
          const newSavedValue = Math.min(g.targetValue, g.saved + value);
          return { ...g, saved: newSavedValue };
        }
        return g;
      })
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }, []);

  const updateUsername = useCallback((username: string) => {
    setState(prev => ({ ...prev, user: { ...prev.user, username } }));
  }, []);

  const resetApp = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_COLOR_KEY);
    setState(initialState);
    // No toast here to avoid re-entry issues on reload
    window.location.reload();
  }, []);

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
  }, []);

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
