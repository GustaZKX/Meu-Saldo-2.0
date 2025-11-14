export interface Transaction {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  isRevenue: boolean;
}

export interface Ganho extends Transaction {
  data: string;
  isRevenue: true;
}

export interface Despesa extends Transaction {
  vencimento: string;
  pago: boolean;
  isRevenue: false;
  recorrencia: 'mensal' | 'unico';
  alarmSettings?: number[];
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  monthlyCommitment: number;
  saved: number;
  monthsInPlan: number;
}

export interface User {
  username: string;
}

export interface ColorCache {
  [category: string]: {
    color: string;
    custom: boolean;
  };
}

declare global {
    interface Window {
        Notification: typeof Notification;
    }
}
