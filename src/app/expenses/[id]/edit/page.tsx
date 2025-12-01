'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { EXPENSE_CATEGORIES, PERIODICITY } from '@/lib/constants';
import type { Expense } from '@/lib/types';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    value: '',
    date: '',
    notes: '',
    partnerId: '',
    periodicity: '',
    phoneNumber: '',
    plan: '',
    renewalDate: '',
  });

  useEffect(() => {
    // Carregar despesa do localStorage
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const expenses = JSON.parse(savedExpenses);
      const foundExpense = expenses.find((exp: any) => exp.id === params.id);
      
      if (foundExpense) {
        setExpense(foundExpense);
        setFormData({
          name: foundExpense.name || '',
          category: foundExpense.category || '',
          value: foundExpense.value?.toString() || '',
          date: foundExpense.date ? new Date(foundExpense.date).toISOString().split('T')[0] : '',
          notes: foundExpense.notes || '',
          partnerId: foundExpense.partnerId || '',
          periodicity: foundExpense.periodicity || '',
          phoneNumber: foundExpense.phoneNumber || '',
          plan: foundExpense.plan || '',
          renewalDate: foundExpense.renewalDate ? new Date(foundExpense.renewalDate).toISOString().split('T')[0] : '',
        });
      }
    }
  }, [params.id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Atualizar despesa
      const updatedExpense = {
        ...expense,
        name: formData.name,
        category: formData.category,
        value: parseFloat(formData.value),
        date: new Date(formData.date),
        notes: formData.notes,
        updatedAt: new Date(),
        partnerId: formData.partnerId || undefined,
        periodicity: formData.periodicity || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        plan: formData.plan || undefined,
        renewalDate: formData.renewalDate ? new Date(formData.renewalDate) : undefined,
      };

      // Carregar despesas do localStorage
      const savedExpenses = localStorage.getItem('expenses');
      const expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

      // Atualizar a despesa
      const updatedExpenses = expenses.map((exp: any) => 
        exp.id === params.id ? updatedExpense : exp
      );

      // Salvar no localStorage
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

      // Redirecionar
      setTimeout(() => {
        setIsLoading(false);
        router.push('/expenses');
      }, 500);
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      setIsLoading(false);
      alert('Erro ao atualizar despesa. Tente novamente.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderCategorySpecificFields = () => {
    switch (formData.category) {
      case 'parcerias':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="partnerId">Parceiro</Label>
              <Select
                value={formData.partnerId}
                onValueChange={(value) => handleChange('partnerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parceiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner1">João Silva</SelectItem>
                  <SelectItem value="partner2">Maria Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodicity">Periodicidade</Label>
              <Select
                value={formData.periodicity}
                onValueChange={(value) => handleChange('periodicity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICITY.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'chips':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número da Linha</Label>
              <Input
                id="phoneNumber"
                placeholder="(11) 99999-9999"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Input
                id="plan"
                placeholder="Ex: Controle 20GB"
                value={formData.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalDate">Data de Renovação</Label>
              <Input
                id="renewalDate"
                type="date"
                value={formData.renewalDate}
                onChange={(e) => handleChange('renewalDate', e.target.value)}
              />
            </div>
          </>
        );

      case 'telefones':
        return (
          <div className="space-y-2">
            <Label htmlFor="plan">Aparelho/Modelo</Label>
            <Input
              id="plan"
              placeholder="Ex: iPhone 13"
              value={formData.plan}
              onChange={(e) => handleChange('plan', e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Despesa</h1>
          <p className="text-gray-600 mt-1">Atualize as informações da despesa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Despesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome da Despesa *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Gasolina, Pagamento Parceiro, etc."
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="value">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre esta despesa..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campos Específicos por Categoria */}
        {formData.category && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {renderCategorySpecificFields()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={handleBack}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
