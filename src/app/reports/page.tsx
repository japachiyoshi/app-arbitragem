'use client';

import { useState } from 'react';
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
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { formatCurrency, PLATFORMS, EXPENSE_CATEGORIES } from '@/lib/constants';

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');

  // Dados mockados
  const reportData = {
    grossProfit: 15420.50,
    netProfit: 8935.75,
    totalExpenses: 6484.75,
    operations: 47,
    expensesByCategory: [
      { category: 'Parcerias', value: 2500.00 },
      { category: 'Transportes', value: 1200.00 },
      { category: 'Chips e Linhas', value: 890.00 },
      { category: 'Custos com Entradas', value: 750.00 },
      { category: 'Selfs', value: 644.75 },
      { category: 'Telefones', value: 300.00 },
      { category: 'Outras', value: 200.00 },
    ],
    profitByPlatform: [
      { platform: 'Mercado Livre', profit: 5200.00, operations: 18 },
      { platform: 'Shopee', profit: 4800.00, operations: 15 },
      { platform: 'Amazon', profit: 3935.75, operations: 14 },
    ],
    topOperations: [
      { name: 'iPhone 13 Pro', profit: 450.00, platform: 'Mercado Livre' },
      { name: 'Smart Watch', profit: 220.00, platform: 'Amazon' },
      { name: 'AirPods Pro', profit: 180.00, platform: 'Shopee' },
    ],
  };

  const handleExportPDF = () => {
    alert('Exportando relatório em PDF...');
  };

  const handleExportExcel = () => {
    alert('Exportando relatório em Excel...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do seu negócio</p>
        </div>
        <div className="flex gap-2">
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
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria de Despesa</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
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
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(reportData.grossProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData.netProfit)}
            </div>
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
              {formatCurrency(reportData.totalExpenses)}
            </div>
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
              {reportData.operations}
            </div>
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
            <div className="space-y-4">
              {reportData.expensesByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{item.category}</p>
                    <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{
                          width: `${(item.value / reportData.totalExpenses) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="ml-4 font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lucro por Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle>Lucro por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.profitByPlatform.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.platform}</p>
                    <p className="text-sm text-gray-500">{item.operations} operações</p>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatCurrency(item.profit)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Operações */}
      <Card>
        <CardHeader>
          <CardTitle>Operações Mais Lucrativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.topOperations.map((op, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white font-bold text-gray-900">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{op.name}</p>
                    <p className="text-sm text-gray-500">{op.platform}</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">
                  +{formatCurrency(op.profit)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Margem */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Margem de Lucro Líquido
            </h3>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              {((reportData.netProfit / reportData.grossProfit) * 100).toFixed(1)}%
            </div>
            <p className="text-gray-600">
              Para cada R$ 100 de lucro bruto, você tem R${' '}
              {((reportData.netProfit / reportData.grossProfit) * 100).toFixed(0)} de lucro
              líquido
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
