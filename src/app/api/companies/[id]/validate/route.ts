import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockCnpjLookup } from '@/lib/services/mockCnpjLookup';
import { addressFiscalSchema } from '@/lib/validations/onboarding';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Empresa nao encontrada.',
        },
        { status: 404 },
      );
    }

    const rawAddressFiscal =
      company.addressFiscalJson &&
      typeof company.addressFiscalJson === 'object' &&
      !Array.isArray(company.addressFiscalJson)
        ? company.addressFiscalJson
        : {};

    const addressFiscal = addressFiscalSchema.parse({
      number: 'S/N',
      ...rawAddressFiscal,
    });

    const validationResult = mockCnpjLookup({
      legalName: company.legalName,
      tradeName: company.tradeName,
      cnpj: company.cnpj,
      addressFiscal,
    });

    const createdValidation = await prisma.companyValidation.create({
      data: {
        companyId: company.id,
        payloadJson: {
          submittedData: {
            legalName: company.legalName,
            tradeName: company.tradeName,
            cnpj: company.cnpj,
            addressFiscal,
          },
          officialData: validationResult.officialData,
        },
        divergencesJson: validationResult.divergences,
        riskLevel: validationResult.riskLevel,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        action: 'COMPANY_VALIDATED',
        metadataJson: {
          validationId: createdValidation.id,
          riskLevel: validationResult.riskLevel,
          divergencesCount: validationResult.divergences.length,
          officialStatus: validationResult.officialData.registrationStatus,
        },
      },
    });

    return NextResponse.json({
      companyId: company.id,
      validationId: createdValidation.id,
      officialData: validationResult.officialData,
      divergences: validationResult.divergences,
      riskLevel: validationResult.riskLevel,
      createdAt: createdValidation.createdAt,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
