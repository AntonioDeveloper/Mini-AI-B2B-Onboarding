'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Alert, Button, Card, Input } from '@/components/ui';
import { createCompanySchema, type CreateCompanyInput } from '@/lib/validations/onboarding';

type FieldErrors = Partial<Record<
  | 'legalName'
  | 'tradeName'
  | 'cnpj'
  | 'email'
  | 'phone'
  | 'addressFiscal.zipCode'
  | 'addressFiscal.state'
  | 'addressFiscal.city'
  | 'addressFiscal.street'
  | 'addressFiscal.number',
  string
>>;

const initialForm: CreateCompanyInput = {
  legalName: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  addressFiscal: {
    zipCode: '',
    state: '',
    city: '',
    street: '',
    number: '',
  },
};

function getFieldErrors(error: {
  issues: Array<{ path: Array<PropertyKey>; message: string }>;
}) {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path
      .filter((part): part is string | number => typeof part !== 'symbol')
      .map((part) => String(part))
      .join('.');

    if (!key) {
      continue;
    }

    if (fieldErrors[key as keyof FieldErrors]) {
      continue;
    }

    fieldErrors[key as keyof FieldErrors] = issue.message;
  }

  return fieldErrors;
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateCompanyInput>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const parsed = createCompanySchema.safeParse(form);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        if (
          response.status === 400 &&
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          (payload as { error?: string }).error === 'VALIDATION_ERROR'
        ) {
          setApiError('Dados invalidos. Revise os campos destacados.');
        } else {
          setApiError('Nao foi possivel criar a empresa. Tente novamente.');
        }

        return;
      }

      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        setApiError('Empresa criada, mas a resposta da API veio inesperada.');
        return;
      }

      const companyId = String((payload as { id: string }).id);
      router.push(`/companies/${companyId}`);
    } catch (error) {
      console.error(error);
      setApiError('Erro inesperado ao criar empresa.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Mini AI B2B Onboarding</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Novo cadastro
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Crie uma empresa para iniciar o fluxo de validacao e decisao.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>

        <Card title="Dados da empresa" description="Campos obrigatorios: razao social, CNPJ e e-mail valido.">
          <form onSubmit={handleSubmit} className="space-y-6">
            {apiError ? (
              <Alert variant="error" title="Nao foi possivel salvar">
                {apiError}
              </Alert>
            ) : null}

            {hasErrors && !apiError ? (
              <Alert variant="warning" title="Revise o formulario">
                Existem campos com erro. Corrija e tente novamente.
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Razao social"
                placeholder="Acme Industria Ltda"
                value={form.legalName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, legalName: event.target.value }))
                }
                error={fieldErrors.legalName}
              />

              <Input
                label="Nome fantasia"
                placeholder="Acme"
                value={form.tradeName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tradeName: event.target.value }))
                }
                error={fieldErrors.tradeName}
              />

              <Input
                label="CNPJ"
                placeholder="12.345.678/0001-90"
                value={form.cnpj}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cnpj: event.target.value }))
                }
                error={fieldErrors.cnpj}
              />

              <Input
                label="E-mail"
                type="email"
                placeholder="contato@acme.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                error={fieldErrors.email}
              />

              <Input
                label="Telefone"
                placeholder="11999998888"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                error={fieldErrors.phone}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Endereco fiscal</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="CEP"
                  placeholder="01000-000"
                  value={form.addressFiscal.zipCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressFiscal: {
                        ...current.addressFiscal,
                        zipCode: event.target.value,
                      },
                    }))
                  }
                  error={fieldErrors['addressFiscal.zipCode']}
                />

                <Input
                  label="UF"
                  placeholder="SP"
                  maxLength={2}
                  value={form.addressFiscal.state}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressFiscal: {
                        ...current.addressFiscal,
                        state: event.target.value,
                      },
                    }))
                  }
                  error={fieldErrors['addressFiscal.state']}
                />

                <Input
                  label="Cidade"
                  placeholder="Sao Paulo"
                  value={form.addressFiscal.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressFiscal: {
                        ...current.addressFiscal,
                        city: event.target.value,
                      },
                    }))
                  }
                  error={fieldErrors['addressFiscal.city']}
                />

                <Input
                  label="Rua"
                  placeholder="Rua das Flores"
                  value={form.addressFiscal.street}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressFiscal: {
                        ...current.addressFiscal,
                        street: event.target.value,
                      },
                    }))
                  }
                  error={fieldErrors['addressFiscal.street']}
                />

                <Input
                  label="Numero"
                  placeholder="123"
                  value={form.addressFiscal.number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressFiscal: {
                        ...current.addressFiscal,
                        number: event.target.value,
                      },
                    }))
                  }
                  error={fieldErrors['addressFiscal.number']}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <Button type="submit" loading={submitting} fullWidth={false}>
                Criar empresa
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

