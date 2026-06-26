import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCompanySchema } from '@/lib/validations/onboarding';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() ?? '';
    const normalizedCnpjQuery = query.replace(/\D/g, '');

    const where = query
      ? {
          OR: [
            {
              legalName: {
                contains: query,
              },
            },
            {
              tradeName: {
                contains: query,
              },
            },
            {
              cnpj: {
                contains: normalizedCnpjQuery || query,
              },
            },
          ],
        }
      : undefined;

    const [companies, pending, approved, rejected] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.company.count({
        where: {
          status: 'PENDING',
        },
      }),
      prisma.company.count({
        where: {
          status: 'APPROVED',
        },
      }),
      prisma.company.count({
        where: {
          status: 'REJECTED',
        },
      }),
    ]);

    return NextResponse.json({
      companies,
      stats: {
        pending,
        approved,
        rejected,
      },
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          issues: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const createdCompany = await prisma.company.create({
      data: {
        legalName: parsed.data.legalName,
        tradeName: parsed.data.tradeName,
        cnpj: parsed.data.cnpj,
        email: parsed.data.email,
        phone: parsed.data.phone,
        status: 'PENDING',
        addressFiscalJson: parsed.data.addressFiscal,
        auditLogs: {
          create: {
            action: 'COMPANY_CREATED',
            metadataJson: {
              source: 'api',
            },
          },
        },
      },
    });

    return NextResponse.json(createdCompany, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
