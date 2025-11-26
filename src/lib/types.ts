// Tipos do sistema de arbitragem

export type OperationStatus = 'em_andamento' | 'finalizada' | 'cancelada';
export type Platform = 'bet365' | 'betano' | 'sportingbet' | 'betfair' | 'pixbet' | 'blaze' | 'stake' | 'outras_casas';
export type ExpenseCategory = 
  | 'parcerias' 
  | 'telefones' 
  | 'chips' 
  | 'transportes' 
  | 'selfs' 
  | 'custos_entradas' 
  | 'outras';
export type Periodicity = 'mensal' | 'semanal' | 'unico';

// Tipos específicos para apostas esportivas (Google Sheets)
export type ResultadoAposta = 'Green' | 'Red' | 'Devolvido' | 'Meio Red' | 'Meio Green';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  monthlyGoal?: number;
}

// Interface para operações de apostas (importadas do Google Sheets - aba BD)
export interface BettingOperation {
  id: string;
  userId: string;
  DATA_APOSTA: Date; // formato DD/MM/AAAA HH:MM
  DATA_EVENTO: Date; // formato DD/MM/AAAA HH:MM
  ESPORTE: string;
  EVENTO: string;
  CASA: string; // casa de apostas
  MERCADO: string;
  ODD: number; // número decimal
  STAKE: number; // valor em R$
  PERCENTUAL: number; // número ou porcentagem
  RESULTADO: ResultadoAposta;
  LUCRO: number; // valor em R$
  createdAt: Date;
  updatedAt: Date;
}

// Interface legada para operações manuais (mantida para compatibilidade)
export interface Operation {
  id: string;
  userId: string;
  name: string;
  date: Date;
  platform: Platform;
  status: OperationStatus;
  purchaseCost: number;
  finalSale: number;
  platformFees: number;
  shipping: number;
  otherFees: number;
  grossProfit: number; // calculado: finalSale - purchaseCost
  netProfit: number; // calculado: grossProfit - (platformFees + shipping + otherFees + despesas relacionadas)
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  name: string;
  category: ExpenseCategory;
  value: number;
  date: Date;
  notes?: string;
  operationId?: string; // opcional: vincula a uma operação específica
  
  // Campos específicos por categoria
  partnerId?: string; // para parcerias
  periodicity?: Periodicity; // para parcerias
  phoneNumber?: string; // para chips
  plan?: string; // para chips
  renewalDate?: Date; // para chips
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Partner {
  id: string;
  userId: string;
  name: string;
  percentage?: number;
  fixedAmount?: number;
  totalPaidThisMonth: number;
  pendingAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  partnerId: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface DashboardMetrics {
  grossProfit: number;
  netProfit: number;
  totalExpenses: number;
  completedOperations: number;
  previousMonthGrossProfit: number;
  previousMonthNetProfit: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  profitByPlatform: Record<Platform, number>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'chip_renewal' | 'recurring_expense' | 'monthly_closing';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  createdAt: Date;
}

// Interface para configuração da planilha do Google Sheets
export interface GoogleSheetsConfig {
  sheetUrl: string;
  sheetId: string;
  tabName: string; // sempre "BD"
  isConnected: boolean;
  lastSync?: Date;
  totalRecords?: number;
}
