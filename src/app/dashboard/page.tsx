import Link from 'next/link';
import { headers } from 'next/headers';
import {
  Alert,
  Button,
  Card,
  Input,
  StatusBadge,
} from '@/components/ui';

type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type DashboardCompany = {
  id: string;
  legalName: string;
  cnpj: string;
  status: CompanyStatus;
  createdAt: string;
};

type DashboardResponse = {
  companies: DashboardCompany[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
};

const defaultData: DashboardResponse = {
  companies: [],
  stats: {
    pending: 0,
    approved: 0,
    rejected: 0,
  },
};

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildEndpoint(query: string) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set('q', query.trim());
  }

  const queryString = params.toString();

  return queryString ? `/api/companies?${queryString}` : '/api/companies';
}

async function fetchDashboardData(query: string) {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host =
    headersList.get('x-forwarded-host') ??
    headersList.get('host') ??
    'localhost:3000';

  const response = await fetch(`${protocol}://${host}${buildEndpoint(query)}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar empresas.');
  }

  return (await response.json()) as DashboardResponse;
}

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const queryValue = resolvedSearchParams.q;
  const appliedQuery =
    typeof queryValue === 'string'
      ? queryValue.trim()
      : Array.isArray(queryValue)
        ? (queryValue[0] ?? '').trim()
        : '';

  let data = defaultData;
  let error: string | null = null;

  try {
    data = await fetchDashboardData(appliedQuery);
  } catch (loadError) {
    console.error(loadError);
    error = 'Nao foi possivel carregar a lista de empresas.';
  }

  const statsCards = [
    {
      title: 'Pendentes',
      value: data.stats.pending,
      tone: 'text-amber-600',
    },
    {
      title: 'Aprovadas',
      value: data.stats.approved,
      tone: 'text-emerald-600',
    },
    {
      title: 'Recusadas',
      value: data.stats.rejected,
      tone: 'text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">
              Mini AI B2B Onboarding
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Acompanhe empresas, status e proximo passo do onboarding.
            </p>
          </div>

          <Link
            href="/companies/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Novo cadastro
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statsCards.map((item) => (
            <Card key={item.title}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">{item.title}</p>
                <p className={['text-3xl font-semibold', item.tone].join(' ')}>
                  {item.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Card title="Empresas" description="Busque por razao social, CNPJ ou nome fantasia.">
          <form action="/dashboard" className="mb-5 flex flex-col gap-3 md:flex-row md:items-end">
            <Input
              name="q"
              label="Busca"
              placeholder="Ex.: Acme ou 12.345.678/0001-90"
              defaultValue={appliedQuery}
              containerClassName="flex-1"
            />
            <div className="flex gap-3">
              <Button type="submit">
                Buscar
              </Button>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Limpar
              </Link>
            </div>
          </form>

          {appliedQuery ? (
            <p className="mb-4 text-sm text-slate-500">
              Filtro aplicado: <span className="font-medium text-slate-700">{appliedQuery}</span>
            </p>
          ) : null}

          {error ? (
            <Alert variant="error" title="Erro ao carregar dashboard">
              {error}
            </Alert>
          ) : null}

          {!error && data.companies.length === 0 ? (
            <Alert variant="info" title="Nenhuma empresa encontrada">
              Ajuste a busca ou crie um novo cadastro para iniciar o fluxo.
            </Alert>
          ) : null}

          {!error && data.companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="py-3 pr-4 font-medium">Razao social</th>
                    <th className="py-3 pr-4 font-medium">CNPJ</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Criado em</th>
                    <th className="py-3 font-medium">Detalhe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                  {data.companies.map((company) => (
                    <tr key={company.id}>
                      <td className="py-4 pr-4 font-medium text-slate-900">
                        {company.legalName}
                      </td>
                      <td className="py-4 pr-4">{formatCnpj(company.cnpj)}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={company.status} />
                      </td>
                      <td className="py-4 pr-4">{formatDate(company.createdAt)}</td>
                      <td className="py-4">
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-medium text-slate-900 underline underline-offset-4"
                        >
                          Ver detalhe
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
