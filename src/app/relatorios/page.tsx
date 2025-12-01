'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/constants';
import type { BettingOperation } from '@/lib/types';
import { extractSheetId } from '@/lib/sheets-parser';

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('month');
  const [operations, setOperations] = useState<BettingOperation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<BettingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  // Função para carregar dados da planilha
  const loadSheetData = async (url: string) => {
    setIsLoading(true);
    setError('');

    try {
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        throw new Error('ID da planilha inválido.');
      }

      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Erro ao acessar a planilha.');
      }

      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      if (lines.length < 2) {
        throw new Error('A planilha está vazia.');
      }

      const loadedOperations: BettingOperation[] = [];

      // Processar CSV
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const cells = parseCSVLine(line);
          if (!cells[0] || !cells[3]) continue;

          const parseDate = (dateStr: string): Date => {
            if (!dateStr) return new Date();
            dateStr = dateStr.replace(/"/g, '').trim();
            const parts = dateStr.split(' ');
            const dateParts = parts[0].split('/');
            
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1;
              const year = parseInt(dateParts[2]);
              
              let hours = 0, minutes = 0;
              if (parts.length > 1 && parts[1]) {
                const timeParts = parts[1].split(':');
                hours = parseInt(timeParts[0]) || 0;
                minutes = parseInt(timeParts[1]) || 0;
              }
              
              return new Date(year, month, day, hours, minutes);
            }
            
            return new Date();
          };

          const parseCurrency = (value: string): number => {
            if (!value) return 0;
            const str = value.toString()
              .replace(/"/g, '')
              .replace('R$', '')
              .replace(/\s/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            return parseFloat(str) || 0;
          };

          const parseNumber = (value: string): number => {
            if (!value) return 0;
            const str = value.toString()
              .replace(/"/g, '')
              .replace('%', '')
              .replace(',', '.');
            return parseFloat(str) || 0;
          };

          const cleanString = (value: string): string => {
            return value ? value.replace(/"/g, '').trim() : '';
          };

          const operation: BettingOperation = {
            id: `sheet-${i}-${Date.now()}`,
            userId: 'user1',
            DATA_APOSTA: parseDate(cells[0]),
            DATA_EVENTO: parseDate(cells[1]),
            ESPORTE: cleanString(cells[2]),
            EVENTO: cleanString(cells[3]),
            CASA: cleanString(cells[4]),
            MERCADO: cleanString(cells[5]),
            ODD: parseNumber(cells[6]),
            STAKE: parseCurrency(cells[7]),
            PERCENTUAL: parseNumber(cells[8]),
            RESULTADO: cleanString(cells[9]) || 'Red',
            LUCRO: parseCurrency(cells[10]),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          loadedOperations.push(operation);
        } catch (err) {
          console.error('Erro ao processar linha:', i, err);
        }
      }

      setOperations(loadedOperations);
      setLastSync(new Date());
      setError('');
      
    } catch (err: any) {
      console.error('Erro ao carregar planilha:', err);
      setError(err.message || 'Erro ao carregar dados da planilha.');
      setOperations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Carregar dados da planilha ao montar o componente
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      loadSheetData(savedUrl);
    }
  }, []);

  // Filtrar operações por período
  useEffect(() => {
    const now = new Date();
    let filtered = operations;

    switch (period) {
      case 'day':
        filtered = operations.filter(op => {
          const opDate = new Date(op.DATA_EVENTO);
          return opDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = operations.filter(op => {
          const opDate = new Date(op.DATA_EVENTO);
          return opDate >= weekAgo && opDate <= now;
        });
        break;
      case 'month':
        filtered = operations.filter(op => {
          const opDate = new Date(op.DATA_EVENTO);
          return opDate.getMonth() === now.getMonth() && opDate.getFullYear() === now.getFullYear();
        });
        break;
      case 'year':
        filtered = operations.filter(op => {
          const opDate = new Date(op.DATA_EVENTO);
          return opDate.getFullYear() === now.getFullYear();
        });
        break;
      default:
        filtered = operations;
    }

    setFilteredOperations(filtered);
  }, [period, operations]);

  // Função para sincronizar manualmente
  const handleSync = async () => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      await loadSheetData(savedUrl);
    } else {
      setError('Nenhuma planilha conectada. Conecte uma planilha na página de Operações.');
    }
  };

  // Calcular métricas
  const grossProfit = filteredOperations.reduce((sum, op) => sum + op.LUCRO, 0);
  const totalStake = filteredOperations.reduce((sum, op) => sum + op.STAKE, 0);
  const totalOperations = filteredOperations.length;
  const greens = filteredOperations.filter(op => op.RESULTADO === 'Green').length;
  const winRate = totalOperations > 0 ? (greens / totalOperations) * 100 : 0;

  // Carregar despesas do localStorage e filtrar por período
  const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
  
  // Filtrar despesas pelo mesmo período das operações
  const filteredExpenses = allExpenses.filter((exp: any) => {
    const expDate = new Date(exp.date);
    const now = new Date();
    
    switch (period) {
      case 'day':
        return expDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expDate >= weekAgo && expDate <= now;
      case 'month':
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      case 'year':
        return expDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const totalExpenses = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.value || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  // Despesas por categoria
  const expensesByCategory = filteredExpenses.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Outras';
    acc[category] = (acc[category] || 0) + (exp.value || 0);
    return acc;
  }, {});

  const expensesByCategoryArray = Object.entries(expensesByCategory)
    .map(([category, value]) => ({ category, value: value as number }))
    .sort((a, b) => b.value - a.value);

  // Lucro por plataforma (casas de apostas mais lucrativas)
  const profitByPlatform = filteredOperations.reduce((acc, op) => {
    const platform = op.CASA || 'Outras';
    if (!acc[platform]) {
      acc[platform] = { profit: 0, operations: 0 };
    }
    acc[platform].profit += op.LUCRO;
    acc[platform].operations += 1;
    return acc;
  }, {} as Record<string, { profit: number; operations: number }>);

  const profitByPlatformArray = Object.entries(profitByPlatform)
    .map(([platform, data]) => ({ platform, profit: data.profit, operations: data.operations }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  // Operações mais lucrativas
  const topOperations = [...filteredOperations]
    .sort((a, b) => b.LUCRO - a.LUCRO)
    .slice(0, 5);

  const handleExportPDF = () => {
    alert('Exportando relatório em PDF...');
  };

  const handleExportExcel = () => {
    alert('Exportando relatório em Excel...');
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      default: return 'Período';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do seu negócio - {getPeriodLabel()}</p>
          {lastSync && (
            <p className="text-xs text-gray-500 mt-1">
              Última sincronização: {lastSync.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Alerta de erro */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lucro Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(grossProfit)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total de apostas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Após despesas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Custos operacionais</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Operações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalOperations}
            </div>
            <p className="text-xs text-gray-500 mt-1">Win Rate: {winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategoryArray.length > 0 ? (
              <div className="space-y-4">
                {expensesByCategoryArray.map((item, index) => {
                  const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.category}</p>
                        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="ml-4 font-semibold text-gray-900">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma despesa registrada no período</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lucro por Plataforma (Casas de Apostas Mais Lucrativas) */}
        <Card>
          <CardHeader>
            <CardTitle>Lucro por Plataforma</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Casas de apostas mais lucrativas no período</p>
          </CardHeader>
          <CardContent>
            {profitByPlatformArray.length > 0 ? (
              <div className="space-y-4">
                {profitByPlatformArray.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.platform}</p>
                      <p className="text-sm text-gray-500">{item.operations} operações</p>
                    </div>
                    <p className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma operação registrada no período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Operações Mais Lucrativas */}
      <Card>
        <CardHeader>
          <CardTitle>Operações Mais Lucrativas</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Top 5 operações com maior lucro no período</p>
        </CardHeader>
        <CardContent>
          {topOperations.length > 0 ? (
            <div className="space-y-3">
              {topOperations.map((op, index) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white font-bold text-gray-900">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{op.EVENTO}</p>
                      <p className="text-sm text-gray-500">{op.CASA} • {op.MERCADO}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${op.LUCRO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {op.LUCRO >= 0 ? '+' : ''}{formatCurrency(op.LUCRO)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stake: {formatCurrency(op.STAKE)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma operação registrada no período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise de Margem */}
      {totalStake > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Margem de Lucro Líquido
              </h3>
              <div className={`text-5xl font-bold mb-2 ${
                netProfit >= 0 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600'
              }`}>
                {totalStake > 0 ? ((netProfit / totalStake) * 100).toFixed(1) : '0.0'}%
              </div>
              <p className="text-gray-600">
                ROI sobre o investimento total em apostas
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
