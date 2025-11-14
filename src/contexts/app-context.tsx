'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Ganho, Despesa, Goal, User, ColorCache } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getConsistentColor, hexToHsl } from '@/lib/colors';
import { addMonths, format, startOfDay, differenceInDays } from 'date-fns';

const LOCAL_STORAGE_KEY = 'meuSaldoData';
const LOCAL_COLOR_KEY = 'meuSaldoColors';

// Helper to check if Notification API is available
const isNotificationAPIAvailable = () => typeof window !== 'undefined' && 'Notification' in window;

interface AppState {
  ganhos: Ganho[];
  despesas: Despesa[];
  goals: Goal[];
  user: User;
  colorCache: ColorCache;
  notificationPermission: NotificationPermission;
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
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  ganhos: [],
  despesas: [],
  goals: [],
  user: { username: "Usuário" },
  colorCache: {},
  notificationPermission: 'default',
};

// --- Notification Helpers ---
const scheduleNotifications = (despesa: Despesa) => {
  if (!isNotificationAPIAvailable() || Notification.permission !== 'granted' || !despesa.alarmSettings) return;

  const title = `Lembrete de Vencimento: ${despesa.nome}`;
  const options = {
    body: `Sua conta de R$ ${despesa.valor.toFixed(2)} vence em breve!`,
    icon: '/logo.png', // Ensure you have a logo.png in your public folder
    tag: despesa.id,
  };

  despesa.alarmSettings.forEach(daysBefore => {
    const dueDate = startOfDay(new Date(despesa.vencimento.replace(/-/g, '\/')));
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(dueDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0); // Schedule for 9 AM

    const now = new Date();
    if (notificationDate > now) {
      const timeout = notificationDate.getTime() - now.getTime();
      setTimeout(() => {
        new Notification(title, options);
      }, timeout);
    }
  });
};

const clearNotifications = (despesaId: string) => {
    // This is a simplified approach. True cancellation of scheduled `setTimeout`
    // would require storing timeout IDs, which adds significant complexity for this app.
    // For a production app, a service worker approach would be more robust.
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
      if(isNotificationAPIAvailable()) {
        loadedState.notificationPermission = Notification.permission;
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
        let toastQueue: Parameters<typeof toast>[0][] = [];

        // Ganhos
        if (prevState.ganhos.length < state.ganhos.length) toastQueue.push({ title: "Sucesso", description: "Ganho adicionado!" });
        if (prevState.ganhos.length > state.ganhos.length) toastQueue.push({ title: "Sucesso", description: "Ganho excluído." });
        const editedGanho = state.ganhos.find(g => {
          const prevG = prevState.ganhos.find(pg => pg.id === g.id);
          return prevG && JSON.stringify(prevG) !== JSON.stringify(g);
        });
        if (editedGanho) toastQueue.push({ title: "Sucesso", description: "Ganho atualizado!" });

        // Despesas
        if (prevState.despesas.length < state.despesas.length) {
            const addedExpense = state.despesas.find(d => !prevState.despesas.some(pd => pd.id === d.id));
            const message = addedExpense?.recorrencia === 'mensal' ? 'Despesa mensal adicionada para o próximo ano.' : 'Despesa adicionada!';
            toastQueue.push({ title: "Sucesso", description: message });
            // Schedule notifications for new expenses
            state.despesas.filter(d => !prevState.despesas.some(pd => pd.id === d.id)).forEach(scheduleNotifications);
        }
        if (prevState.despesas.length > state.despesas.length) toastQueue.push({ title: "Sucesso", description: "Despesa excluída." });
        
        const editedDespesa = state.despesas.find(d => {
            const prevD = prevState.despesas.find(pd => pd.id === d.id);
            return prevD && JSON.stringify(prevD) !== JSON.stringify(d) && prevD.pago === d.pago; // Ignore pago toggle
        });
        if (editedDespesa) {
            toastQueue.push({ title: "Sucesso", description: "Despesa atualizada!" });
            // Reschedule notifications for edited expenses
            clearNotifications(editedDespesa.id);
            scheduleNotifications(editedDespesa);
        }

        const toggledDespesa = state.despesas.find(d => {
          const prevD = prevState.despesas.find(pd => pd.id === d.id);
          return prevD && prevD.pago !== d.pago;
        });
        if (toggledDespesa) {
          const message = toggledDespesa.pago ? "Conta marcada como paga!" : "Pagamento desmarcado.";
          toastQueue.push({ title: "Sucesso", description: message });
          if (toggledDespesa.pago) {
            clearNotifications(toggledDespesa.id);
          } else {
            scheduleNotifications(toggledDespesa);
          }
        }

        // Metas
        const newGoal = state.goals.find(g => !prevState.goals.some(pg => pg.id === g.id));
        if (newGoal) {
            toastQueue.push({ title: "Sucesso", description: `Meta "${newGoal.name}" criada!` });
        }
        if (prevState.goals.length > state.goals.length) toastQueue.push({ title: "Sucesso", description: "Meta excluída." });
        
        const contributedGoal = state.goals.find(currentGoal => {
          const prevGoal = prevState.goals.find(g => g.id === currentGoal.id);
          return prevGoal && prevGoal.saved < currentGoal.saved;
        });
        if(contributedGoal) {
            toastQueue.push({ title: "Sucesso", description: `Valor adicionado à meta "${contributedGoal.name}"` });
             if (contributedGoal.saved >= contributedGoal.targetValue) {
               toastQueue.push({ title: "Parabéns!", description: `Meta "${contributedGoal.name}" atingida!` });
             }
        }


        // Outros
        if (prevState.user.username !== state.user.username) toastQueue.push({ title: "Sucesso", description: "Nome de usuário atualizado!" });
        if (JSON.stringify(prevState.colorCache) !== JSON.stringify(state.colorCache)) toastQueue.push({ title: 'Sucesso', description: 'Cores personalizadas salvas!' });

        if (toastQueue.length > 0) {
            toastQueue.forEach(t => toast(t));
        }

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
    setState(prev => {
        const despesa = prev.despesas.find(d => d.id === id);
        if(despesa) clearNotifications(despesa.id);
        return { ...prev, despesas: prev.despesas.filter(d => d.id !== id) }
    });
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

  const requestNotificationPermission = useCallback(async () => {
    if (!isNotificationAPIAvailable()) {
      toast({
        variant: 'destructive',
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push.',
      });
      return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, notificationPermission: permission }));
    if (permission === 'denied') {
      toast({
        variant: 'destructive',
        title: 'Permissão Negada',
        description: 'Você precisa habilitar as notificações nas configurações do seu navegador.',
      });
    }
    return permission;
  }, [toast]);

  const value: AppContextType = {
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
    requestNotificationPermission,
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
