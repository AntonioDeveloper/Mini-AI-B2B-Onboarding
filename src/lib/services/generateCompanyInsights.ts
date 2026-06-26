import {
  aiInsightSchema,
  type AiInsightInput,
} from '../validations/onboarding';
import type { DivergenceInput, RiskLevel } from '../validations/onboarding';

export type CompanyInsightsCompanyInput = {
  legalName: string;
  tradeName: string;
  cnpj: string;
};

export type CompanyInsightsValidationInput = {
  riskLevel: RiskLevel;
  divergences: DivergenceInput[];
};

export type GenerateCompanyInsightsInput = {
  company: CompanyInsightsCompanyInput;
  latestValidation: CompanyInsightsValidationInput | null;
};

function getNextAction(riskLevel: RiskLevel) {
  if (riskLevel === 'LOW') {
    return 'Sugerir aprovacao.';
  }

  if (riskLevel === 'MEDIUM') {
    return 'Sugerir revisao manual pelo backoffice.';
  }

  return 'Sugerir recusa ou bloqueio temporario ate correcao dos dados.';
}

function formatDivergenceSummary(divergences: DivergenceInput[]) {
  const top = divergences.slice(0, 3);

  return top
    .map((divergence) => {
      const submitted =
        divergence.submittedValue === null
          ? 'null'
          : String(divergence.submittedValue);
      const official =
        divergence.officialValue === null
          ? 'null'
          : String(divergence.officialValue);

      return `${divergence.field}: "${submitted}" -> "${official}"`;
    })
    .join('; ');
}

export function generateCompanyInsights({
  company,
  latestValidation,
}: GenerateCompanyInsightsInput): AiInsightInput {
  if (!latestValidation) {
    const result: AiInsightInput = {
      summary: `Sem validacao registrada para ${company.tradeName} (${company.cnpj}).`,
      riskLevel: 'MEDIUM',
      nextAction: 'Executar validacao antes de aprovar ou recusar.',
    };

    return aiInsightSchema.parse(result);
  }

  const nextAction = getNextAction(latestValidation.riskLevel);
  const divergencesText =
    latestValidation.divergences.length === 0
      ? 'Sem divergencias.'
      : `Principais divergencias: ${formatDivergenceSummary(
          latestValidation.divergences,
        )}.`;

  const result: AiInsightInput = {
    summary: `AI insights para ${company.tradeName} (${company.cnpj}): risco ${latestValidation.riskLevel}. ${divergencesText}`,
    riskLevel: latestValidation.riskLevel,
    nextAction,
  };

  return aiInsightSchema.parse(result);
}
