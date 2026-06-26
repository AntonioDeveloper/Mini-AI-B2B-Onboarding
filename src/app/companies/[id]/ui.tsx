'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  RiskBadge,
  StatusBadge,
  Textarea,
} from '@/components/ui';

type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type AuditLog = {
  id: string;
  action: string;
  metadataJson: unknown;
  createdAt: string;
};

type CompanyValidation = {
  id: string;
  riskLevel: RiskLevel;
  divergencesJson: unknown;
  createdAt: string;
};

type CompanyDetail = {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  status: CompanyStatus;
  addressFiscalJson: unknown;
  createdAt: string;
  updatedAt: string;
  validations: CompanyValidation[];
  auditLogs: AuditLog[];
};

type Divergence = {
  field?: string;
  message?: string;
  submittedValue?: unknown;
  officialValue?: unknown;
  submitted?: unknown;
  official?: unknown;
};

type AiInsight = {
  summary: string;
  nextAction: string;
  riskLevel: RiskLevel;
};

type DecisionBody =
  | { decision: 'APPROVE' }
  | { decision: 'REJECT'; reason: string };

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getLatestValidation(validations: CompanyValidation[]) {
  if (!validations.length) {
    return null;
  }

  return validations[0];
}

function normalizeDivergences(value: unknown): Divergence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'object' && item ? (item as Divergence) : null))
    .filter((item): item is Divergence => Boolean(item));
}

function formatDivergence(div: Divergence) {
  const field = div.field ?? 'campo';
  const message = div.message ?? '';
  const submittedValue =
    div.submittedValue ?? div.submitted ?? (div as Record<string, unknown>).submitted;
  const officialValue =
    div.officialValue ?? div.official ?? (div as Record<string, unknown>).official;

  const submitted = submittedValue === undefined ? '' : String(submittedValue);
  const official = officialValue === undefined ? '' : String(officialValue);

  return {
    title: field,
    message,
    submitted,
    official,
  };
}

async function safeJson(response: Response) {
  return (await response.json().catch(() => null)) as unknown;
}

export default function CompanyDetailClient({
  companyId,
  initialCompany,
}: {
  companyId: string;
  initialCompany: unknown;
}) {
  const [company, setCompany] = useState<CompanyDetail | null>(
    initialCompany ? (initialCompany as CompanyDetail) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    null | 'validate' | 'insights' | 'approve' | 'reject'
  >(null);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const latestValidation = useMemo(() => {
    if (!company) {
      return null;
    }

    return getLatestValidation(company.validations);
  }, [company]);

  const latestDivergences = useMemo(() => {
    if (!latestValidation) {
      return [];
    }

    return normalizeDivergences(latestValidation.divergencesJson);
  }, [latestValidation]);

  const addressFiscal = useMemo(() => asRecord(company?.addressFiscalJson ?? null), [company]);

  async function refreshCompany() {
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setCompany(null);
        setError('Empresa nao encontrada.');
        return;
      }

      if (!response.ok) {
        setError('Nao foi possivel recarregar a empresa.');
        return;
      }

      const payload = (await safeJson(response)) as CompanyDetail;
      setCompany(payload);
    } catch (loadError) {
      console.error(loadError);
      setError('Erro inesperado ao recarregar a empresa.');
    }
  }

  async function handleValidate() {
    setBusyAction('validate');
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/validate`, {
        method: 'POST',
      });

      if (!response.ok) {
        setError('Nao foi possivel executar a validacao.');
        return;
      }

      await refreshCompany();
    } catch (validateError) {
      console.error(validateError);
      setError('Erro inesperado ao executar validacao.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleInsights() {
    setBusyAction('insights');
    setError(null);

    try {
      const response = await fetch(`/api/ai/company/${companyId}/insights`, {
        method: 'POST',
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        if (response.status === 400) {
          const message =
            payload &&
            typeof payload === 'object' &&
            !Array.isArray(payload) &&
            'message' in payload &&
            typeof (payload as { message?: unknown }).message === 'string'
              ? (payload as { message: string }).message
              : null;

          setError(message ?? 'Nao foi possivel gerar insights. Execute a validacao antes.');
          return;
        }

        setError('Nao foi possivel gerar insights.');
        return;
      }

      if (
        payload &&
        typeof payload === 'object' &&
        'summary' in payload &&
        'nextAction' in payload &&
        'riskLevel' in payload
      ) {
        setInsight(payload as AiInsight);
      } else {
        setError('Resposta inesperada ao gerar insights.');
      }

      await refreshCompany();
    } catch (insightsError) {
      console.error(insightsError);
      setError('Erro inesperado ao gerar insights.');
    } finally {
      setBusyAction(null);
    }
  }

  async function submitDecision(body: DecisionBody) {
    setDecisionError(null);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        if (response.status === 400) {
          setDecisionError('Dados invalidos para decisao. Revise e tente novamente.');
          return;
        }

        if (response.status === 404) {
          setDecisionError('Empresa nao encontrada.');
          return;
        }

        setDecisionError('Nao foi possivel salvar a decisao.');
        return;
      }

      setCompany(payload as CompanyDetail);
      await refreshCompany();
    } catch (decisionError) {
      console.error(decisionError);
      setDecisionError('Erro inesperado ao salvar decisao.');
    }
  }

  async function handleApprove() {
    setBusyAction('approve');
    await submitDecision({ decision: 'APPROVE' });
    setBusyAction(null);
  }

  async function handleReject() {
    const trimmed = rejectReason.trim();

    if (!trimmed) {
      setDecisionError('Motivo e obrigatorio para recusar.');
      return;
    }

    setBusyAction('reject');
    await submitDecision({ decision: 'REJECT', reason: trimmed });
    setBusyAction(null);
  }

  if (!company) {
    return (
      <Alert variant="error" title="Empresa nao encontrada">
        Verifique o ID ou volte para o dashboard.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="error" title="Erro">
          {error}
        </Alert>
      ) : null}

      <Card
        title={company.tradeName || company.legalName}
        description={`CNPJ: ${formatCnpj(company.cnpj)}`}
        action={<StatusBadge status={company.status} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dados principais
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Razao social</dt>
                <dd className="text-right font-medium text-slate-900">{company.legalName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nome fantasia</dt>
                <dd className="text-right font-medium text-slate-900">{company.tradeName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">E-mail</dt>
                <dd className="text-right font-medium text-slate-900">{company.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Telefone</dt>
                <dd className="text-right font-medium text-slate-900">{company.phone}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Endereco fiscal
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Rua</dt>
                <dd className="text-right font-medium text-slate-900">
                  {String(addressFiscal?.street ?? '-')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Numero</dt>
                <dd className="text-right font-medium text-slate-900">
                  {String(addressFiscal?.number ?? '-')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cidade</dt>
                <dd className="text-right font-medium text-slate-900">
                  {String(addressFiscal?.city ?? '-')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">UF</dt>
                <dd className="text-right font-medium text-slate-900">
                  {String(addressFiscal?.state ?? '-')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">CEP</dt>
                <dd className="text-right font-medium text-slate-900">
                  {String(addressFiscal?.zipCode ?? '-')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            loading={busyAction === 'validate'}
            onClick={handleValidate}
          >
            Consultar CNPJ/Sintegra
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={busyAction === 'insights'}
            onClick={handleInsights}
          >
            Gerar insight de IA
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Validacao mais recente"
          description={latestValidation ? `Executada em ${formatDate(latestValidation.createdAt)}` : 'Sem validacao ainda.'}
          action={latestValidation ? <RiskBadge riskLevel={latestValidation.riskLevel} /> : null}
        >
          {!latestValidation ? (
            <Alert variant="info" title="Sem validacao">
              Clique em Consultar CNPJ/Sintegra para gerar divergencias e nivel de risco.
            </Alert>
          ) : latestDivergences.length === 0 ? (
            <Alert variant="success" title="Sem divergencias">
              Nenhuma divergencia encontrada na validacao mais recente.
            </Alert>
          ) : (
            <div className="space-y-3">
              {latestDivergences.map((divergence, index) => {
                const formatted = formatDivergence(divergence);

                return (
                  <div key={`${formatted.title}-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{formatted.title}</p>
                    {formatted.message ? (
                      <p className="mt-1 text-sm text-slate-600">{formatted.message}</p>
                    ) : null}
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 p-2">
                        <p className="font-semibold text-slate-700">Informado</p>
                        <p className="mt-1 break-words">{formatted.submitted || '-'}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-2">
                        <p className="font-semibold text-slate-700">Oficial</p>
                        <p className="mt-1 break-words">{formatted.official || '-'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="AI insights" description="Resumo operacional gerado com fallback deterministico.">
          {!insight ? (
            <Alert variant="info" title="Sem insight">
              Clique em Gerar insight de IA para obter resumo, risco e proxima acao.
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RiskBadge riskLevel={insight.riskLevel} />
                <p className="text-sm font-medium text-slate-700">Sugestao de backoffice</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Summary
                </p>
                <p className="mt-2 text-sm text-slate-800">{insight.summary}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Proxima acao
                </p>
                <p className="mt-2 text-sm text-slate-800">{insight.nextAction}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Decisao" description="Aprovacao ou recusa pelo operador.">
        {decisionError ? (
          <Alert variant="error" title="Nao foi possivel salvar decisao">
            {decisionError}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              loading={busyAction === 'approve'}
              disabled={company.status !== 'PENDING'}
              onClick={handleApprove}
            >
              Aprovar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={busyAction === 'reject'}
              disabled={company.status !== 'PENDING'}
              onClick={handleReject}
            >
              Recusar
            </Button>
          </div>

          <div className="w-full max-w-xl">
            <Textarea
              label="Motivo da recusa"
              placeholder="Obrigatorio apenas se for recusar."
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </div>
        </div>

        {company.status !== 'PENDING' ? (
          <p className="mt-4 text-sm text-slate-500">
            Status atual: <span className="font-medium text-slate-700">{company.status}</span>. A decisao ja foi tomada.
          </p>
        ) : null}
      </Card>

      <Card title="Auditoria" description="Timeline de eventos do onboarding.">
        {company.auditLogs.length === 0 ? (
          <Alert variant="info" title="Sem eventos">
            Nenhum evento registrado ainda.
          </Alert>
        ) : (
          <ol className="space-y-3">
            {company.auditLogs.map((log) => (
              <li key={log.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                  </div>
                  {log.metadataJson ? (
                    <pre className="max-h-40 w-full overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700 sm:max-w-lg">
                      {JSON.stringify(log.metadataJson, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

