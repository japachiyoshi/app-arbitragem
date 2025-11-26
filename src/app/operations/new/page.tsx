'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { PLATFORMS, OPERATION_STATUS } from '@/lib/constants';

export default function NewOperationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    platform: '',
    status: 'em_andamento',
    purchaseCost: '',
    finalSale: '',
    platformFees: '',
    shipping: '',
    otherFees: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateGrossProfit = () => {
    const sale = parseFloat(formData.finalSale) || 0;
    const cost = parseFloat(formData.purchaseCost) || 0;
    return sale - cost;
  };

  const calculateNetProfit = () => {
    const grossProfit = calculateGrossProfit();
    const fees = parseFloat(formData.platformFees) || 0;
    const shipping = parseFloat(formData.shipping) || 0;
    const other = parseFloat(formData.otherFees) || 0;
    return grossProfit - fees - shipping - other;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular salvamento
    setTimeout(() => {
      setIsLoading(false);
      router.push('/operations');
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Operação</h1>
          <p className="text-gray-600 mt-1">Registre uma nova operação de arbitragem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome da Operação *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Aposta Bet365 - Futebol"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
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

              <div className="space-y-2">
                <Label htmlFor="platform">Casa de Apostas *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => handleChange('platform', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a casa de apostas" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseCost">Custo da Aposta *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="purchaseCost"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.purchaseCost}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalSale">Retorno Final *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="finalSale"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.finalSale}
                    onChange={(e) => handleChange('finalSale', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformFees">Taxas da Plataforma</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="platformFees"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.platformFees}
                    onChange={(e) => handleChange('platformFees', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping">Taxas de Saque</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="shipping"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.shipping}
                    onChange={(e) => handleChange('shipping', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="otherFees">Outras Taxas</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">R$</span>
                  <Input
                    id="otherFees"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.otherFees}
                    onChange={(e) => handleChange('otherFees', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Cálculos Automáticos */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Lucro Bruto:</span>
                <span className="text-lg font-bold text-green-600">
                  R$ {calculateGrossProfit().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Lucro Líquido:</span>
                <span className="text-lg font-bold text-blue-600">
                  R$ {calculateNetProfit().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {isLoading ? 'Salvando...' : 'Salvar Operação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
