// Constantes do sistema

export const PLATFORMS = [
  { value: 'bet365', label: 'Bet365' },
  { value: 'betano', label: 'Betano' },
  { value: 'sportingbet', label: 'Sportingbet' },
  { value: 'betfair', label: 'Betfair' },
  { value: 'pixbet', label: 'Pixbet' },
  { value: 'blaze', label: 'Blaze' },
  { value: 'stake', label: 'Stake' },
  { value: 'outras_casas', label: 'Outras Casas de Apostas' },
] as const;

export const OPERATION_STATUS = [
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { value: 'finalizada', label: 'Finalizada', color: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'parcerias', label: 'Parcerias', icon: 'Users' },
  { value: 'telefones', label: 'Telefones', icon: 'Smartphone' },
  { value: 'chips', label: 'Chips e Linhas', icon: 'Sim' },
  { value: 'transportes', label: 'Transportes', icon: 'Car' },
  { value: 'selfs', label: 'Selfs / Self-checkout', icon: 'ShoppingCart' },
  { value: 'custos_entradas', label: 'Custos com Entradas', icon: 'Package' },
  { value: 'outras', label: 'Outras Despesas', icon: 'DollarSign' },
] as const;

export const PERIODICITY = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'unico', label: 'Único' },
] as const;

export const REPORT_FILTERS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
] as const;

// Resultados de apostas
export const RESULTADO_APOSTAS = [
  { value: 'Green', label: 'Green', color: 'bg-green-500' },
  { value: 'Red', label: 'Red', color: 'bg-red-500' },
  { value: 'Devolvido', label: 'Devolvido', color: 'bg-gray-500' },
  { value: 'Meio Red', label: 'Meio Red', color: 'bg-orange-500' },
  { value: 'Meio Green', label: 'Meio Green', color: 'bg-emerald-500' },
] as const;

// Cores para gráficos
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatação de data - corrigido para evitar hydration mismatch
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Usar UTC para garantir consistência entre servidor e cliente
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

// Formatação de data e hora
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Usar UTC para garantir consistência entre servidor e cliente
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Calcular porcentagem de mudança
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
