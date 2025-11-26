'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Link2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/constants';
import type { BettingOperation } from '@/lib/types';
import { isValidGoogleSheetsUrl, extractSheetId } from '@/lib/sheets-parser';

export default function OperationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [esporteFilter, setEsporteFilter] = useState<string>('all');
  const [casaFilter, setCasaFilter] = useState<string>('all');
  const [resultadoFilter, setResultadoFilter] = useState<string>('all');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [showSheetInput, setShowSheetInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [operations, setOperations] = useState<BettingOperation[]>([]);
  const [error, setError] = useState<string>('');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Carregar URL da planilha do localStorage ao montar
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    if (savedUrl) {
      setSheetUrl(savedUrl);
      setIsSheetConnected(true);
      loadSheetData(savedUrl);
    }
  }, []);

  const loadSheetData = async (url: string) => {
    setIsLoading(true);
    setError('');

    try {
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        throw new Error('ID da planilha inválido. Verifique se o link está correto.');
      }

      // Usar a API pública do Google Sheets via CSV export
      // Formato: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
      // Primeiro, vamos tentar pegar o GID da aba BD
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0'; // Default para primeira aba

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Erro ao acessar a planilha. Verifique se ela está compartilhada como "Qualquer pessoa com o link pode visualizar".');
      }

      const csvText = await response.text();
      
      // Processar CSV
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        throw new Error('A planilha está vazia ou não contém dados.');
      }

      const loadedOperations: BettingOperation[] = [];

      // Pular primeira linha (cabeçalho) e processar dados
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          // Parse CSV line (considerando vírgulas dentro de aspas)
          const cells = parseCSVLine(line);
          
          // Verificar se a linha tem dados válidos (pelo menos DATA_APOSTA e EVENTO)
          if (!cells[0] || !cells[3]) continue;

          // Função para parsear data brasileira
          const parseDate = (dateStr: string): Date => {
            if (!dateStr) return new Date();
            
            // Remover aspas se houver
            dateStr = dateStr.replace(/"/g, '').trim();
            
            // Formato: DD/MM/AAAA HH:MM ou DD/MM/AAAA
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

          // Função para parsear moeda
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

          // Função para parsear número
          const parseNumber = (value: string): number => {
            if (!value) return 0;
            
            const str = value.toString()
              .replace(/"/g, '')
              .replace('%', '')
              .replace(',', '.');
            
            return parseFloat(str) || 0;
          };

          // Função para limpar string
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

      if (loadedOperations.length === 0) {
        throw new Error('Nenhum dado válido encontrado na planilha. Verifique se os dados estão no formato correto.');
      }

      setOperations(loadedOperations);
      setIsSheetConnected(true);
      setLastSync(new Date());
      localStorage.setItem('googleSheetsUrl', url);
      setError('');
      
    } catch (err: any) {
      console.error('Erro ao carregar planilha:', err);
      setError(err.message || 'Erro ao carregar dados da planilha. Verifique se a planilha está compartilhada publicamente.');
      setOperations([]);
      setIsSheetConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para parsear linha CSV considerando vírgulas dentro de aspas
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

  const filteredOperations = operations.filter((op) => {
    const matchesSearch = 
      op.EVENTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.ESPORTE.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.CASA.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEsporte = esporteFilter === 'all' || op.ESPORTE === esporteFilter;
    const matchesCasa = casaFilter === 'all' || op.CASA === casaFilter;
    const matchesResultado = resultadoFilter === 'all' || op.RESULTADO === resultadoFilter;
    return matchesSearch && matchesEsporte && matchesCasa && matchesResultado;
  });

  // Extrair esportes únicos
  const esportes = Array.from(new Set(operations.map(op => op.ESPORTE))).filter(Boolean);
  const casas = Array.from(new Set(operations.map(op => op.CASA))).filter(Boolean);

  const getResultadoBadge = (resultado: string) => {
    const colorMap = {
      'Green': 'bg-green-100 text-green-700 border-green-200',
      'Red': 'bg-red-100 text-red-700 border-red-200',
      'Devolvido': 'bg-gray-100 text-gray-700 border-gray-200',
      'Meio Red': 'bg-orange-100 text-orange-700 border-orange-200',
      'Meio Green': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };

    return (
      <Badge className={colorMap[resultado as keyof typeof colorMap] || 'bg-gray-100 text-gray-700'}>
        {resultado}
      </Badge>
    );
  };

  const handleConnectSheet = async () => {
    if (!sheetUrl.trim()) {
      setError('Por favor, insira o link da planilha.');
      return;
    }

    if (!isValidGoogleSheetsUrl(sheetUrl)) {
      setError('Por favor, insira um link válido do Google Sheets.');
      return;
    }

    await loadSheetData(sheetUrl);
    setShowSheetInput(false);
  };

  const handleDisconnectSheet = () => {
    if (confirm('Deseja realmente desconectar a planilha?')) {
      setSheetUrl('');
      setIsSheetConnected(false);
      setOperations([]);
      setLastSync(null);
      localStorage.removeItem('googleSheetsUrl');
    }
  };

  const handleSyncSheet = async () => {
    if (sheetUrl) {
      await loadSheetData(sheetUrl);
    }
  };

  // Calcular estatísticas
  const totalStake = filteredOperations.reduce((sum, op) => sum + op.STAKE, 0);
  const totalLucro = filteredOperations.reduce((sum, op) => sum + op.LUCRO, 0);
  const greens = filteredOperations.filter(op => op.RESULTADO === 'Green').length;
  const reds = filteredOperations.filter(op => op.RESULTADO === 'Red').length;
  const winRate = filteredOperations.length > 0 ? (greens / filteredOperations.length) * 100 : 0;

  // Dados para gráficos
  const getLucroPorDia = () => {
    const lucroMap = new Map<string, number>();
    
    operations.forEach(op => {
      const dateKey = op.DATA_EVENTO.toLocaleDateString('pt-BR');
      const currentLucro = lucroMap.get(dateKey) || 0;
      lucroMap.set(dateKey, currentLucro + op.LUCRO);
    });

    return Array.from(lucroMap.entries())
      .sort((a, b) => {
        const dateA = a[0].split('/').reverse().join('');
        const dateB = b[0].split('/').reverse().join('');
        return dateA.localeCompare(dateB);
      })
      .slice(-7); // Últimos 7 dias
  };

  const getLucroPorDiaSemana = () => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const lucroMap = new Map<number, number>();
    
    operations.forEach(op => {
      const dia = op.DATA_EVENTO.getDay();
      const currentLucro = lucroMap.get(dia) || 0;
      lucroMap.set(dia, currentLucro + op.LUCRO);
    });

    return diasSemana.map((nome, index) => ({
      dia: nome,
      lucro: lucroMap.get(index) || 0
    }));
  };

  const lucroPorDia = getLucroPorDia();
  const lucroPorDiaSemana = getLucroPorDiaSemana();
  const maxLucroDia = Math.max(...lucroPorDia.map(d => Math.abs(d[1])), 1);
  const maxLucroSemana = Math.max(...lucroPorDiaSemana.map(d => Math.abs(d.lucro)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operações de Apostas</h1>
              <p className="text-gray-600 mt-1">Gerencie suas apostas esportivas</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isSheetConnected ? "default" : "outline"}
            onClick={() => setShowSheetInput(!showSheetInput)}
            className="w-full sm:w-auto"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {isSheetConnected ? 'Planilha Conectada' : 'Conectar Planilha'}
          </Button>
        </div>
      </div>

      {/* Card de Conexão com Google Sheets */}
      {showSheetInput && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-6 w-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Conectar Planilha do Google Sheets
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Cole o link da sua planilha do Google Sheets. O sistema importará automaticamente 
                    os dados da aba selecionada.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="sheet-url" className="text-blue-900">
                        Link da Planilha do Google Sheets
                      </Label>
                      <Input
                        id="sheet-url"
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={sheetUrl}
                        onChange={(e) => {
                          setSheetUrl(e.target.value);
                          setError('');
                        }}
                        className="mt-1.5 bg-white"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-blue-600 mt-1.5">
                        💡 Certifique-se de que a planilha está compartilhada como "Qualquer pessoa com o link pode visualizar"
                      </p>
                      {error && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleConnectSheet}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Conectar Planilha
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowSheetInput(false);
                          setError('');
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruções sobre formato da planilha */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">
                  📋 Formato esperado da planilha (colunas na ordem):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <p>• <strong>DATA_APOSTA:</strong> DD/MM/AAAA HH:MM</p>
                    <p>• <strong>DATA_EVENTO:</strong> DD/MM/AAAA HH:MM</p>
                    <p>• <strong>ESPORTE:</strong> Texto (ex: Futebol)</p>
                    <p>• <strong>EVENTO:</strong> Texto (ex: Time A x Time B)</p>
                    <p>• <strong>CASA:</strong> Texto (ex: Bet365)</p>
                    <p>• <strong>MERCADO:</strong> Texto (ex: Resultado Final)</p>
                  </div>
                  <div>
                    <p>• <strong>ODD:</strong> Número decimal (ex: 2.50)</p>
                    <p>• <strong>STAKE:</strong> R$ (ex: R$ 100,00)</p>
                    <p>• <strong>PERCENTUAL:</strong> Número ou % (ex: 5%)</p>
                    <p>• <strong>RESULTADO:</strong> Green, Red, Devolvido, Meio Red, Meio Green</p>
                    <p>• <strong>LUCRO:</strong> R$ (ex: R$ 150,00)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ⚠️ Importante: Vá em Compartilhar → Alterar para "Qualquer pessoa com o link" → Visualizador
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status da Conexão */}
      {isSheetConnected && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    Planilha Conectada com Sucesso
                  </h3>
                  <p className="text-sm text-green-700">
                    {operations.length} operações importadas
                    {lastSync && ` • Última sincronização: ${lastSync.toLocaleTimeString('pt-BR')}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSyncSheet}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectSheet}
                  className="text-red-600 hover:text-red-700"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Lucro */}
      {operations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico: Lucro por Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Lucro por Dia (Últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lucroPorDia.map(([data, lucro]) => (
                  <div key={data} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{data}</span>
                      <span className={`font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(lucro)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${lucro >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(Math.abs(lucro) / maxLucroDia) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico: Lucro por Dia da Semana */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Lucro por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lucroPorDiaSemana.map(({ dia, lucro }) => (
                  <div key={dia} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{dia}</span>
                      <span className={`font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(lucro)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${lucro >= 0 ? 'bg-purple-500' : 'bg-red-500'}`}
                        style={{ width: `${(Math.abs(lucro) / maxLucroSemana) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar evento, esporte, casa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={esporteFilter} onValueChange={setEsporteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Esporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Esportes</SelectItem>
                {esportes.map((esporte) => (
                  <SelectItem key={esporte} value={esporte}>
                    {esporte}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={casaFilter} onValueChange={setCasaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Casa de Apostas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Casas</SelectItem>
                {casas.map((casa) => (
                  <SelectItem key={casa} value={casa}>
                    {casa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Resultados</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Devolvido">Devolvido</SelectItem>
                <SelectItem value="Meio Red">Meio Red</SelectItem>
                <SelectItem value="Meio Green">Meio Green</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Estatístico */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Apostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOperations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stake Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalStake)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lucro Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLucro)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {greens}G / {reds}R
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalStake > 0 && totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalStake > 0 ? ((totalLucro / totalStake) * 100).toFixed(1) : '0.0'}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Operações */}
      <div className="grid gap-4">
        {filteredOperations.map((operation) => (
          <Card key={operation.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info Principal */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {operation.EVENTO}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-blue-50">
                          {operation.ESPORTE}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {operation.CASA}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">
                          {operation.MERCADO}
                        </span>
                      </div>
                    </div>
                    {getResultadoBadge(operation.RESULTADO)}
                  </div>

                  {/* Datas e Odd */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">Aposta:</span>{' '}
                      <span className="font-medium">{formatDateTime(operation.DATA_APOSTA)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Evento:</span>{' '}
                      <span className="font-medium">{formatDateTime(operation.DATA_EVENTO)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Odd:</span>{' '}
                      <span className="font-bold text-blue-600">{operation.ODD.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Stake</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(operation.STAKE)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Percentual</p>
                      <p className="font-semibold text-gray-900">
                        {operation.PERCENTUAL}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lucro</p>
                      <p className={`font-semibold ${operation.LUCRO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(operation.LUCRO)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Retorno</p>
                      <p className={`font-semibold ${operation.LUCRO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(operation.STAKE + operation.LUCRO)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOperations.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma operação encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {isSheetConnected 
                  ? 'Nenhuma operação corresponde aos filtros selecionados'
                  : 'Conecte sua planilha do Google Sheets para importar suas apostas'}
              </p>
              {!isSheetConnected && (
                <Button onClick={() => setShowSheetInput(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar Planilha
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
