import { NextResponse } from 'next/server';
import { mockCnpjLookup } from '@/lib/services/mockCnpjLookup';

export async function GET() {
  const result = mockCnpjLookup({
    legalName: 'Beta Servicos Ltda',
    tradeName: 'Beta',
    cnpj: '12.345.678/0001-11',
    addressFiscal: {
      zipCode: '13000-000',
      state: 'SP',
      city: 'Campinas',
      street: 'Rua B',
      number: '200',
    },
  });

  return NextResponse.json(result);
}
