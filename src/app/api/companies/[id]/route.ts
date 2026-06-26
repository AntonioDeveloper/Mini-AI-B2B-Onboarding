import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        validations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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

    return NextResponse.json(company);
  } catch {
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
