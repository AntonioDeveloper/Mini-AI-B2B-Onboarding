import { headers } from 'next/headers';
import Link from 'next/link';
import { Alert } from '@/components/ui';
import CompanyDetailClient from './ui';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchCompany(id: string) {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host =
    headersList.get('x-forwarded-host') ??
    headersList.get('host') ??
    'localhost:3000';

  const response = await fetch(`${protocol}://${host}/api/companies/${id}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (response.status === 404) {
    return {
      company: null as unknown,
      error: 'Empresa nao encontrada.',
    };
  }

  if (!response.ok) {
    return {
      company: null as unknown,
      error: 'Nao foi possivel carregar a empresa.',
    };
  }

  return {
    company: (await response.json()) as unknown,
    error: null as string | null,
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await fetchCompany(id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Mini AI B2B Onboarding</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Detalhe da empresa
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>

        {result.error ? (
          <Alert variant="error" title="Erro">
            {result.error}
          </Alert>
        ) : null}

        <CompanyDetailClient key={id} companyId={id} initialCompany={result.company} />
      </div>
    </div>
  );
}

