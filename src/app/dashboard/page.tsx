'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { formatCurrency, calculatePercentageChange } from '@/lib/constants';
import Link from 'next/link';
import type { BettingOperation } from '@/lib/types';
import { extractSheetId } from '@/lib/sheets-parser';

interface MonthConfig {
  month: number;
  year: number;
  gid: string;
  name: string;
}

export default function DashboardPage() {
  const [operations, setOperations] = useState<BettingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthConfig, setShowMonthConfig] = useState(false);
  const [monthConfigs, setMonthConfigs] = useState<MonthConfig[]>([]);
  const [newMonthGid, setNewMonthGid] = useState('');

  // Carregar configurações de meses do localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    const savedConfigs = localStorage.getItem('monthConfigs');
    
    if (savedUrl) {
      setIsSheetConnected(true);
    }
    
    if (savedConfigs) {
      setMonthConfigs(JSON.parse(savedConfigs));
    }
  }, []);

  // Carregar dados quando mudar o mês selecionado
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl && isSheetConnected) {
      loadSheetDataForMonth(savedUrl, selectedDate);
    }
  }, [selectedDate, isSheetConnected]);

  const loadSheetDataForMonth = async (url: string, date: Date) => {
    setIsLoading(true);

    try {
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        throw new Error('ID da planilha inválido');
      }

      // Procurar configuração para o mês selecionado
      const monthConfig = monthConfigs.find(
        config => config.month === date.getMonth() && config.year === date.getFullYear()
      );

      // Se não encontrar configuração, tentar usar GID padrão da URL
      let gid = '0';
      if (monthConfig) {
        gid = monthConfig.gid;
      } else {
        const gidMatch = url.match(/[#&]gid=([0-9]+)/);
        if (gidMatch) {
          gid = gidMatch[1];
        }
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Erro ao acessar a planilha');
      }

      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      if (lines.length < 2) {
        setOperations([]);
        setLastSync(new Date());
        setIsLoading(false);
        return;
      }

      const loadedOperations: BettingOperation[] = [];

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
      setIsSheetConnected(true);
      setLastSync(new Date());
      
    } catch (err: any) {
      console.error('Erro ao carregar planilha:', err);
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

  const handleSyncSheet = async () => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      await loadSheetDataForMonth(savedUrl, selectedDate);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  };

  const handleAddMonthConfig = () => {
    if (!newMonthGid.trim()) return;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const newConfig: MonthConfig = {
      month: selectedDate.getMonth(),
      year: selectedDate.getFullYear(),
      gid: newMonthGid.trim(),
      name: `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`,
    };

    const updatedConfigs = [...monthConfigs.filter(
      c => !(c.month === newConfig.month && c.year === newConfig.year)
    ), newConfig];

    setMonthConfigs(updatedConfigs);
    localStorage.setItem('monthConfigs', JSON.stringify(updatedConfigs));
    
    setNewMonthGid('');
    
    // Recarregar dados com novo GID sem fechar o modal
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      loadSheetDataForMonth(savedUrl, selectedDate);
    }
  };

  const handleRemoveMonthConfig = (month: number, year: number) => {
    const updatedConfigs = monthConfigs.filter(
      c => !(c.month === month && c.year === year)
    );
    setMonthConfigs(updatedConfigs);
    localStorage.setItem('monthConfigs', JSON.stringify(updatedConfigs));
  };

  const getCurrentMonthConfig = () => {
    return monthConfigs.find(
      c => c.month === selectedDate.getMonth() && c.year === selectedDate.getFullYear()
    );
  };

  // Calcular métricas do mês selecionado
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  const currentMonthOps = operations;

  const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

  // Para comparação, precisaríamos carregar dados do mês anterior
  // Por simplicidade, vamos usar apenas os dados atuais
  const previousMonthOps: BettingOperation[] = [];

  const currentStats = {
    totalStake: currentMonthOps.reduce((sum, op) => sum + op.STAKE, 0),
    totalLucro: currentMonthOps.reduce((sum, op) => sum + op.LUCRO, 0),
    totalOperations: currentMonthOps.length,
    greens: currentMonthOps.filter(op => op.RESULTADO === 'Green').length,
  };

  const previousStats = {
    totalStake: previousMonthOps.reduce((sum, op) => sum + op.STAKE, 0),
    totalLucro: previousMonthOps.reduce((sum, op) => sum + op.LUCRO, 0),
    totalOperations: previousMonthOps.length,
    greens: previousMonthOps.filter(op => op.RESULTADO === 'Green').length,
  };

  const stakeChange = calculatePercentageChange(currentStats.totalStake, previousStats.totalStake);
  const lucroChange = calculatePercentageChange(currentStats.totalLucro, previousStats.totalLucro);
  const operationsChange = calculatePercentageChange(currentStats.totalOperations, previousStats.totalOperations);
  const winRate = currentStats.totalOperations > 0 ? (currentStats.greens / currentStats.totalOperations) * 100 : 0;
  const previousWinRate = previousStats.totalOperations > 0 ? (previousStats.greens / previousStats.totalOperations) * 100 : 0;
  const winRateChange = winRate - previousWinRate;

  const totalDespesas = currentStats.totalStake;

  const recentOperations = [...currentMonthOps]
    .sort((a, b) => b.DATA_EVENTO.getTime() - a.DATA_EVENTO.getTime())
    .slice(0, 5);

  const lucroPorEsporte = currentMonthOps.reduce((acc, op) => {
    const esporte = op.ESPORTE || 'Outros';
    acc[esporte] = (acc[esporte] || 0) + op.LUCRO;
    return acc;
  }, {} as Record<string, number>);

  const esportesOrdenados = Object.entries(lucroPorEsporte)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalLucroEsportes = esportesOrdenados.reduce((sum, [, lucro]) => sum + Math.abs(lucro), 0);

  const lucroPorPlataforma = currentMonthOps.reduce((acc, op) => {
    const casa = op.CASA || 'Outros';
    acc[casa] = (acc[casa] || 0) + op.LUCRO;
    return acc;
  }, {} as Record<string, number>);

  const plataformasOrdenadas = Object.entries(lucroPorPlataforma)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalLucroPlataformas = plataformasOrdenadas.reduce((sum, [, lucro]) => sum + Math.abs(lucro), 0);

  const operacoesLucrativas = [...currentMonthOps]
    .sort((a, b) => b.LUCRO - a.LUCRO)
    .slice(0, 5);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthConfig = getCurrentMonthConfig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral das suas apostas esportivas</p>
        </div>
        <div className="flex gap-2">
          {isSheetConnected && (
            <>
              <Button 
                variant="outline"
                onClick={() => setShowMonthConfig(!showMonthConfig)}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Meses
              </Button>
              <Button 
                variant="outline"
                onClick={handleSyncSheet}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </>
          )}
          <Link href="/operations">
            <Button className="w-full sm:w-auto">
              <Target className="h-4 w-4 mr-2" />
              Ver Operações
            </Button>
          </Link>
        </div>
      </div>

      {/* Configuração de Meses */}
      {showMonthConfig && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Abas da Planilha por Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-sm mb-3">
                📋 Como encontrar o GID da aba:
              </h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Abra sua planilha no Google Sheets</li>
                <li>Clique na aba do mês que deseja configurar</li>
                <li>Copie a URL do navegador</li>
                <li>Procure por "gid=" na URL (ex: gid=123456789)</li>
                <li>Cole apenas os números após "gid=" no campo abaixo</li>
              </ol>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-sm mb-3">
                Configurar {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h4>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="month-gid">GID da Aba *</Label>
                  <Input
                    id="month-gid"
                    placeholder="Ex: 123456789"
                    value={newMonthGid}
                    onChange={(e) => setNewMonthGid(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleAddMonthConfig} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
              </div>
            </div>

            {monthConfigs.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-sm mb-3">Meses Configurados:</h4>
                <div className="space-y-2">
                  {monthConfigs.map((config) => (
                    <div
                      key={`${config.year}-${config.month}`}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {config.name}
                        </p>
                        <p className="text-xs text-gray-500">GID: {config.gid}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMonthConfig(config.month, config.year)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status da Conexão */}
      {isSheetConnected && lastSync && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>
                Planilha sincronizada • {operations.length} operações
                {currentMonthConfig && ` • Aba: ${currentMonthConfig.name}`} • 
                Última atualização: {lastSync.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isSheetConnected && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Conecte sua Planilha do Google Sheets
                </h3>
                <p className="text-sm text-blue-700">
                  Sincronize suas apostas automaticamente e visualize estatísticas em tempo real
                </p>
              </div>
              <Link href="/operations">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Conectar Agora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Mês */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {monthNames[selectedMonth]} {selectedYear}
                </h3>
                {currentMonthConfig && (
                  <p className="text-xs text-purple-600">
                    Aba: {currentMonthConfig.name}
                  </p>
                )}
                {!currentMonthConfig && isSheetConnected && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Mês não configurado - usando aba padrão
                  </p>
                )}
                {!isCurrentMonth() && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleCurrentMonth}
                    className="text-xs text-purple-600 h-auto p-0 mt-1"
                  >
                    Voltar para mês atual
                  </Button>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
              className="bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Despesas (Stakes) */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Despesas (Stakes)
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDespesas)}
            </div>
            <div className="flex items-center mt-2">
              {stakeChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  stakeChange >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {Math.abs(stakeChange).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Total */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lucro Total
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentStats.totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentStats.totalLucro)}
            </div>
            <div className="flex items-center mt-2">
              {lucroChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  lucroChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(lucroChange).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Win Rate
            </CardTitle>
            <Target className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {winRate.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2">
              {winRateChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  winRateChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(winRateChange).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Total de Operações */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Operações
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {currentStats.totalOperations}
            </div>
            <div className="flex items-center mt-2">
              {operationsChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  operationsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(operationsChange).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lucro por Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle>Lucro por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            {plataformasOrdenadas.length > 0 ? (
              <div className="space-y-4">
                {plataformasOrdenadas.map(([plataforma, lucro]) => {
                  const percentage = totalLucroPlataformas > 0 ? (Math.abs(lucro) / totalLucroPlataformas) * 100 : 0;
                  return (
                    <div key={plataforma} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{plataforma}</span>
                        <span className={`font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lucro)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              lucro >= 0 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum dado disponível</p>
                <p className="text-sm mt-1">Conecte sua planilha para ver estatísticas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operações Mais Lucrativas */}
        <Card>
          <CardHeader>
            <CardTitle>Operações Mais Lucrativas</CardTitle>
          </CardHeader>
          <CardContent>
            {operacoesLucrativas.length > 0 ? (
              <div className="space-y-3">
                {operacoesLucrativas.map((operation) => (
                  <div
                    key={operation.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{operation.EVENTO}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{operation.MERCADO}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {operation.DATA_EVENTO.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`font-semibold ${operation.LUCRO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {operation.LUCRO >= 0 ? '+' : ''}{formatCurrency(operation.LUCRO)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stake: {formatCurrency(operation.STAKE)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma operação registrada</p>
                <p className="text-sm mt-1">Conecte sua planilha para ver suas apostas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lucro por Esporte */}
        <Card>
          <CardHeader>
            <CardTitle>Lucro por Esporte</CardTitle>
          </CardHeader>
          <CardContent>
            {esportesOrdenados.length > 0 ? (
              <div className="space-y-4">
                {esportesOrdenados.map(([esporte, lucro]) => {
                  const percentage = totalLucroEsportes > 0 ? (Math.abs(lucro) / totalLucroEsportes) * 100 : 0;
                  return (
                    <div key={esporte} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{esporte}</span>
                        <span className={`font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lucro)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              lucro >= 0 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum dado disponível</p>
                <p className="text-sm mt-1">Conecte sua planilha para ver estatísticas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas Operações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Operações do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOperations.length > 0 ? (
              <div className="space-y-3">
                {recentOperations.map((operation) => (
                  <div
                    key={operation.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{operation.EVENTO}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{operation.MERCADO}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {operation.DATA_EVENTO.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`font-semibold ${operation.LUCRO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {operation.LUCRO >= 0 ? '+' : ''}{formatCurrency(operation.LUCRO)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stake: {formatCurrency(operation.STAKE)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma operação registrada</p>
                <p className="text-sm mt-1">Conecte sua planilha para ver suas apostas</p>
              </div>
            )}
            <Link href="/operations">
              <Button variant="outline" className="w-full mt-4">
                Ver Todas as Operações
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ROI Card */}
      {currentStats.totalStake > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ROI do Mês
                </h3>
                <p className="text-sm text-gray-600">
                  Retorno sobre o investimento total em apostas
                </p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  currentStats.totalLucro >= 0 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600'
                }`}>
                  {((currentStats.totalLucro / currentStats.totalStake) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStats.greens} greens de {currentStats.totalOperations} apostas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}