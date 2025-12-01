'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DollarSign,
  Edit,
  Trash2,
  Users,
  Smartphone,
  Car,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { formatCurrency, EXPENSE_CATEGORIES } from '@/lib/constants';
import type { Expense } from '@/lib/types';

const categoryIcons: Record<string, any> = {
  parcerias: Users,
  telefones: Smartphone,
  chips: Smartphone,
  transportes: Car,
  selfs: ShoppingCart,
  custos_entradas: Package,
  outras: DollarSign,
};

// Função de formatação de data no cliente
function formatDateClient(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Carregar despesas do localStorage
  useEffect(() => {
    setMounted(true);
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      // Converter strings de data para objetos Date
      const expensesWithDates = parsed.map((exp: any) => ({
        ...exp,
        date: new Date(exp.date),
        createdAt: new Date(exp.createdAt),
        updatedAt: new Date(exp.updatedAt),
        renewalDate: exp.renewalDate ? new Date(exp.renewalDate) : undefined,
      }));
      setExpenses(expensesWithDates);
    }
  }, []);

  // Função para deletar despesa
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      setExpenses(updatedExpenses);
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, expenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  }, [filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const categoryExpenses = filteredExpenses.filter((e) => e.category === cat.value);
      const total = categoryExpenses.reduce((sum, e) => sum + e.value, 0);
      return {
        ...cat,
        total,
        count: categoryExpenses.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      };
    }).filter((cat) => cat.count > 0);
  }, [filteredExpenses, totalExpenses]);

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || DollarSign;
    return <Icon className="h-5 w-5" />;
  };

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600 mt-1">Controle detalhado de todas as despesas</p>
        </div>
        <Link href="/expenses/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar despesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Categoria */}
      {expensesByCategory.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expensesByCategory.map((category) => (
                  <div key={category.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          {getCategoryIcon(category.value)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{category.label}</p>
                          <p className="text-sm text-gray-500">{category.count} despesa(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(category.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Total */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="p-4 rounded-full bg-white shadow-lg">
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-white">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(expense.category)}
                      </Badge>
                      <span className="text-sm text-gray-500" suppressHydrationWarning>
                        {mounted ? formatDateClient(expense.date) : ''}
                      </span>
                      {expense.notes && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{expense.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(expense.value)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/expenses/${expense.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-600"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma despesa encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {expenses.length === 0 
                  ? 'Comece registrando suas despesas' 
                  : 'Tente ajustar os filtros de busca'}
              </p>
              <Link href="/expenses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
