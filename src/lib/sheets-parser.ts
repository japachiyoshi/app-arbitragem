// Utilitário para processar dados da planilha do Google Sheets (aba BD)

import type { BettingOperation, ResultadoAposta } from './types';

/**
 * Extrai o ID da planilha do Google Sheets a partir da URL
 */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Valida se a URL é um link válido do Google Sheets
 */
export function isValidGoogleSheetsUrl(url: string): boolean {
  return url.includes('docs.google.com/spreadsheets');
}

/**
 * Converte string de data brasileira (DD/MM/AAAA HH:MM) para objeto Date
 */
export function parseBrazilianDateTime(dateStr: string): Date {
  // Formato esperado: DD/MM/AAAA HH:MM
  const parts = dateStr.trim().split(' ');
  const datePart = parts[0]; // DD/MM/AAAA
  const timePart = parts[1] || '00:00'; // HH:MM (padrão 00:00 se não fornecido)
  
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Converte string de moeda brasileira (R$ 1.234,56) para número
 */
export function parseBrazilianCurrency(currencyStr: string): number {
  // Remove R$, espaços e converte vírgula para ponto
  const cleanStr = currencyStr
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // remove separador de milhar
    .replace(',', '.'); // converte vírgula decimal para ponto
  
  return parseFloat(cleanStr) || 0;
}

/**
 * Converte string de porcentagem para número
 */
export function parsePercentage(percentStr: string | number): number {
  if (typeof percentStr === 'number') return percentStr;
  
  const cleanStr = percentStr.toString().replace('%', '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
}

/**
 * Valida e normaliza o resultado da aposta
 */
export function parseResultado(resultado: string): ResultadoAposta {
  const normalized = resultado.trim();
  const validResults: ResultadoAposta[] = ['Green', 'Red', 'Devolvido', 'Meio Red', 'Meio Green'];
  
  if (validResults.includes(normalized as ResultadoAposta)) {
    return normalized as ResultadoAposta;
  }
  
  // Fallback para valores similares
  const lower = normalized.toLowerCase();
  if (lower.includes('green')) return 'Green';
  if (lower.includes('red')) return 'Red';
  if (lower.includes('devol')) return 'Devolvido';
  if (lower.includes('meio') && lower.includes('red')) return 'Meio Red';
  if (lower.includes('meio') && lower.includes('green')) return 'Meio Green';
  
  return 'Red'; // fallback padrão
}

/**
 * Interface para linha bruta da planilha
 */
interface RawSheetRow {
  DATA_APOSTA: string;
  DATA_EVENTO: string;
  ESPORTE: string;
  EVENTO: string;
  CASA: string;
  MERCADO: string;
  ODD: string | number;
  STAKE: string | number;
  PERCENTUAL: string | number;
  RESULTADO: string;
  LUCRO: string | number;
}

/**
 * Processa uma linha da planilha e converte para BettingOperation
 */
export function parseSheetRow(row: RawSheetRow, userId: string, index: number): BettingOperation {
  const now = new Date();
  
  return {
    id: `sheet-${index}-${Date.now()}`,
    userId,
    DATA_APOSTA: parseBrazilianDateTime(row.DATA_APOSTA),
    DATA_EVENTO: parseBrazilianDateTime(row.DATA_EVENTO),
    ESPORTE: row.ESPORTE.trim(),
    EVENTO: row.EVENTO.trim(),
    CASA: row.CASA.trim(),
    MERCADO: row.MERCADO.trim(),
    ODD: typeof row.ODD === 'number' ? row.ODD : parseFloat(row.ODD.toString().replace(',', '.')),
    STAKE: typeof row.STAKE === 'number' ? row.STAKE : parseBrazilianCurrency(row.STAKE.toString()),
    PERCENTUAL: parsePercentage(row.PERCENTUAL),
    RESULTADO: parseResultado(row.RESULTADO),
    LUCRO: typeof row.LUCRO === 'number' ? row.LUCRO : parseBrazilianCurrency(row.LUCRO.toString()),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Processa array de linhas da planilha
 */
export function parseSheetData(rows: RawSheetRow[], userId: string): BettingOperation[] {
  return rows
    .filter(row => row.DATA_APOSTA && row.EVENTO) // filtra linhas vazias
    .map((row, index) => parseSheetRow(row, userId, index));
}

/**
 * Valida estrutura da planilha (verifica se tem as colunas necessárias)
 */
export function validateSheetStructure(headers: string[]): { valid: boolean; missing: string[] } {
  const requiredColumns = [
    'DATA_APOSTA',
    'DATA_EVENTO',
    'ESPORTE',
    'EVENTO',
    'CASA',
    'MERCADO',
    'ODD',
    'STAKE',
    'PERCENTUAL',
    'RESULTADO',
    'LUCRO',
  ];
  
  const missing = requiredColumns.filter(col => !headers.includes(col));
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gera estatísticas das operações importadas
 */
export function generateImportStats(operations: BettingOperation[]) {
  const totalOperations = operations.length;
  const totalStake = operations.reduce((sum, op) => sum + op.STAKE, 0);
  const totalLucro = operations.reduce((sum, op) => sum + op.LUCRO, 0);
  
  const greens = operations.filter(op => op.RESULTADO === 'Green').length;
  const reds = operations.filter(op => op.RESULTADO === 'Red').length;
  const devolvidos = operations.filter(op => op.RESULTADO === 'Devolvido').length;
  
  const winRate = totalOperations > 0 ? (greens / totalOperations) * 100 : 0;
  const roi = totalStake > 0 ? (totalLucro / totalStake) * 100 : 0;
  
  return {
    totalOperations,
    totalStake,
    totalLucro,
    greens,
    reds,
    devolvidos,
    winRate: winRate.toFixed(2),
    roi: roi.toFixed(2),
  };
}
