import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { companyDecisionSchema } from '@/lib/validations/onboarding';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = companyDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          issues: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const existingCompany = await prisma.company.findUnique({
      where: {
        id,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Empresa nao encontrada.',
        },
        { status: 404 },
      );
    }

    const nextStatus =
      parsed.data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const decisionAction =
      parsed.data.decision === 'APPROVE'
        ? 'COMPANY_APPROVED'
        : 'COMPANY_REJECTED';

    const updatedCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: {
          id,
        },
        data: {
          status: nextStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: company.id,
          action: decisionAction,
          metadataJson: {
            reason: parsed.data.reason ?? null,
            decision: parsed.data.decision,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: company.id,
          action: 'EMAIL_MOCK_SENT',
          metadataJson: {
            template: 'backoffice-company-decision',
            destination: 'backoffice@mock.local',
            relatedAction: decisionAction,
            reason: parsed.data.reason ?? null,
          },
        },
      });

      return company;
    });

    return NextResponse.json(updatedCompany);
  } catch {
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
