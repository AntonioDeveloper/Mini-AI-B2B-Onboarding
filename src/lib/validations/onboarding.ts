import { z } from 'zod';

export const companyStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const decisionSchema = z
  .enum(['APPROVE', 'REJECT'])
  .describe('Decisao final do operador para o cadastro.');

export const addressFiscalSchema = z.object({
  zipCode: z.string().trim().min(1, 'CEP obrigatorio.'),
  state: z.string().trim().toUpperCase().length(2, 'UF deve ter 2 letras.'),
  city: z.string().trim().min(1, 'Cidade obrigatoria.'),
  street: z.string().trim().min(1, 'Rua obrigatoria.'),
  number: z.string().trim().min(1, 'Numero obrigatorio.'),
});

export const sanitizeCnpj = (value: string) => value.replace(/\D/g, '');

export const cnpjSchema = z
  .string()
  .trim()
  .transform(sanitizeCnpj)
  .refine((value) => value.length === 14, {
    message: 'CNPJ deve conter 14 digitos.',
  });

export const createCompanySchema = z.object({
  legalName: z.string().trim().min(1, 'Razao social obrigatoria.'),
  tradeName: z.string().trim().min(1, 'Nome fantasia obrigatorio.'),
  cnpj: cnpjSchema,
  email: z.email('E-mail invalido.'),
  phone: z.string().trim().min(1, 'Telefone obrigatorio.'),
  addressFiscal: addressFiscalSchema,
});

export const companyDecisionSchema = z
  .object({
    decision: decisionSchema,
    reason: z.string().trim().optional(),
  })
  .superRefine(({ decision, reason }, ctx) => {
    if (decision === 'REJECT' && !reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Motivo obrigatorio quando a decisao for REJECT.',
      });
    }
  });

export const divergenceSchema = z.object({
  field: z.string().trim().min(1, 'Campo da divergencia obrigatorio.'),
  submittedValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  officialValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  message: z.string().trim().min(1, 'Descricao da divergencia obrigatoria.'),
});

export const aiInsightSchema = z.object({
  summary: z.string().trim().min(1, 'Resumo obrigatorio.'),
  riskLevel: riskLevelSchema,
  nextAction: z.string().trim().min(1, 'Proxima acao obrigatoria.'),
});

export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type AddressFiscalInput = z.infer<typeof addressFiscalSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CompanyDecisionInput = z.infer<typeof companyDecisionSchema>;
export type DivergenceInput = z.infer<typeof divergenceSchema>;
export type AiInsightInput = z.infer<typeof aiInsightSchema>;
