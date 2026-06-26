import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateCompanyInsights } from '@/lib/services/generateCompanyInsights';
import { divergenceSchema } from '@/lib/validations/onboarding';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const divergencesArraySchema = z.array(divergenceSchema);

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

    const latestValidation = await prisma.companyValidation.findFirst({
      where: {
        companyId: company.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestValidation) {
      return NextResponse.json(
        {
          error: 'VALIDATION_REQUIRED',
          message:
            'Nenhuma validacao encontrada para esta empresa. Execute a validacao antes de gerar AI insights.',
        },
        { status: 400 },
      );
    }

    const divergences = divergencesArraySchema.parse(
      latestValidation.divergencesJson,
    );

    const insights = generateCompanyInsights({
      company: {
        legalName: company.legalName,
        tradeName: company.tradeName,
        cnpj: company.cnpj,
      },
      latestValidation: {
        riskLevel: latestValidation.riskLevel,
        divergences,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        action: 'AI_INSIGHT_GENERATED',
        metadataJson: {
          validationId: latestValidation.id,
          riskLevel: insights.riskLevel,
          nextAction: insights.nextAction,
        },
      },
    });

    return NextResponse.json({
      summary: insights.summary,
      nextAction: insights.nextAction,
      riskLevel: insights.riskLevel,
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
