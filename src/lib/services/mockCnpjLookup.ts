import {
  sanitizeCnpj,
  type CreateCompanyInput,
  type DivergenceInput,
  type RiskLevel,
} from '../validations/onboarding';

export type CompanyLookupInput = Pick<
  CreateCompanyInput,
  'legalName' | 'tradeName' | 'cnpj' | 'addressFiscal'
>;

export type OfficialCompanyData = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  state: string;
  city: string;
  registrationStatus: 'ATIVA' | 'INAPTA';
};

export type MockCnpjLookupResult = {
  officialData: OfficialCompanyData;
  divergences: DivergenceInput[];
  riskLevel: RiskLevel;
};

const STATE_SEQUENCE = [
  'SP',
  'RJ',
  'MG',
  'PR',
  'SC',
  'RS',
  'BA',
  'GO',
] as const;

function getAlternativeState(currentState: string) {
  const normalizedState = currentState.trim().toUpperCase();
  const fallback = 'SP';
  const foundState = STATE_SEQUENCE.find((state) => state !== normalizedState);

  return foundState ?? fallback;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateNameSimilarity(left: string, right: string) {
  const leftWords = new Set(normalizeText(left).split(' ').filter(Boolean));
  const rightWords = new Set(normalizeText(right).split(' ').filter(Boolean));

  if (leftWords.size === 0 || rightWords.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const word of leftWords) {
    if (rightWords.has(word)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftWords, ...rightWords]).size;

  return union === 0 ? 0 : intersection / union;
}

function buildOfficialLegalName(
  company: CompanyLookupInput,
  cleanCnpj: string,
) {
  if (cleanCnpj.endsWith('22')) {
    return 'Omega Participacoes S/A';
  }

  return company.legalName.trim();
}

function getRiskLevel(
  divergences: DivergenceInput[],
  registrationStatus: OfficialCompanyData['registrationStatus'],
): RiskLevel {
  if (registrationStatus === 'INAPTA') {
    return 'HIGH';
  }

  if (divergences.length === 0) {
    return 'LOW';
  }

  if (divergences.length === 1) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

export function mockCnpjLookup(
  company: CompanyLookupInput,
): MockCnpjLookupResult {
  const cleanCnpj = sanitizeCnpj(company.cnpj);
  const registrationStatus = cleanCnpj.endsWith('00') ? 'INAPTA' : 'ATIVA';
  const officialState = cleanCnpj.endsWith('11')
    ? getAlternativeState(company.addressFiscal.state)
    : company.addressFiscal.state.trim().toUpperCase();
  const officialLegalName = buildOfficialLegalName(company, cleanCnpj);

  const officialData: OfficialCompanyData = {
    cnpj: cleanCnpj,
    legalName: officialLegalName,
    tradeName: company.tradeName.trim(),
    state: officialState,
    city: company.addressFiscal.city.trim(),
    registrationStatus,
  };

  const divergences: DivergenceInput[] = [];

  if (company.addressFiscal.state.trim().toUpperCase() !== officialData.state) {
    divergences.push({
      field: 'addressFiscal.state',
      submittedValue: company.addressFiscal.state.trim().toUpperCase(),
      officialValue: officialData.state,
      message: 'UF informada difere da UF retornada na consulta simulada.',
    });
  }

  const legalNameSimilarity = calculateNameSimilarity(
    company.legalName,
    officialData.legalName,
  );

  if (legalNameSimilarity < 0.6) {
    divergences.push({
      field: 'legalName',
      submittedValue: company.legalName.trim(),
      officialValue: officialData.legalName,
      message:
        'Razao social informada esta muito diferente da razao social oficial simulada.',
    });
  }

  return {
    officialData,
    divergences,
    riskLevel: getRiskLevel(divergences, registrationStatus),
  };
}
