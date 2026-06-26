import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.companyValidation.deleteMany();
  await prisma.company.deleteMany();

  await prisma.company.create({
    data: {
      legalName: 'Alfa Industrial Ltda',
      tradeName: 'Alfa Industrial',
      cnpj: '12345678000110',
      email: 'contato@alfaindustrial.com',
      phone: '11999990001',
      status: 'PENDING',
      addressFiscalJson: {
        street: 'Rua das Industrias, 100',
        number: '100',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
      auditLogs: {
        create: [
          {
            action: 'COMPANY_CREATED',
            metadataJson: {
              source: 'seed',
              note: 'Empresa pendente sem validacao',
            },
          },
        ],
      },
    },
  });

  await prisma.company.create({
    data: {
      legalName: 'Beta Servicos Empresariais Ltda',
      tradeName: 'Beta Servicos',
      cnpj: '22345678000110',
      email: 'cadastro@betaservicos.com',
      phone: '11999990002',
      status: 'PENDING',
      addressFiscalJson: {
        street: 'Avenida Central, 200',
        number: '200',
        city: 'Campinas',
        state: 'SP',
        zipCode: '13000-000',
      },
      validations: {
        create: [
          {
            payloadJson: {
              submittedLegalName: 'Beta Servicos Empresariais Ltda',
              submittedState: 'SP',
              submittedEmail: 'cadastro@betaservicos.com',
            },
            divergencesJson: [
              {
                field: 'tradeName',
                submitted: 'Beta Servicos',
                official: 'Beta Solucoes Corporativas',
              },
              {
                field: 'address.state',
                submitted: 'SP',
                official: 'MG',
              },
            ],
            riskLevel: 'HIGH',
          },
        ],
      },
      auditLogs: {
        create: [
          {
            action: 'COMPANY_CREATED',
            metadataJson: {
              source: 'seed',
            },
          },
          {
            action: 'VALIDATION_REQUESTED',
            metadataJson: {
              provider: 'mock-cnpj-sintegra',
            },
          },
          {
            action: 'VALIDATION_COMPLETED',
            metadataJson: {
              divergencesCount: 2,
              riskLevel: 'HIGH',
            },
          },
        ],
      },
    },
  });

  await prisma.company.create({
    data: {
      legalName: 'Gamma Tech Consultoria Ltda',
      tradeName: 'Gamma Tech',
      cnpj: '32345678000110',
      email: 'hello@gammatech.com',
      phone: '11999990003',
      status: 'APPROVED',
      addressFiscalJson: {
        street: 'Rua da Inovacao, 300',
        number: '300',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80000-000',
      },
      validations: {
        create: [
          {
            payloadJson: {
              submittedLegalName: 'Gamma Tech Consultoria Ltda',
              submittedState: 'PR',
            },
            divergencesJson: [],
            riskLevel: 'LOW',
          },
        ],
      },
      auditLogs: {
        create: [
          {
            action: 'COMPANY_CREATED',
            metadataJson: {
              source: 'seed',
            },
          },
          {
            action: 'VALIDATION_COMPLETED',
            metadataJson: {
              divergencesCount: 0,
              riskLevel: 'LOW',
            },
          },
          {
            action: 'COMPANY_APPROVED',
            metadataJson: {
              reason: 'Dados consistentes e risco baixo',
            },
          },
        ],
      },
    },
  });

  await prisma.company.create({
    data: {
      legalName: 'Delta Logistica Nacional Ltda',
      tradeName: 'Delta Logistica',
      cnpj: '42345678000110',
      email: 'backoffice@deltalogistica.com',
      phone: '11999990004',
      status: 'REJECTED',
      addressFiscalJson: {
        street: 'Rodovia Empresarial, 400',
        number: '400',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30000-000',
      },
      validations: {
        create: [
          {
            payloadJson: {
              submittedLegalName: 'Delta Logistica Nacional Ltda',
              submittedState: 'MG',
            },
            divergencesJson: [
              {
                field: 'cnpjStatus',
                submitted: 'ATIVA',
                official: 'INAPTA',
              },
            ],
            riskLevel: 'HIGH',
          },
        ],
      },
      auditLogs: {
        create: [
          {
            action: 'COMPANY_CREATED',
            metadataJson: {
              source: 'seed',
            },
          },
          {
            action: 'VALIDATION_COMPLETED',
            metadataJson: {
              divergencesCount: 1,
              riskLevel: 'HIGH',
            },
          },
          {
            action: 'COMPANY_REJECTED',
            metadataJson: {
              reason: 'CNPJ com situacao inapta na consulta simulada',
            },
          },
        ],
      },
    },
  });

  const companies = await prisma.company.findMany({
    include: {
      validations: true,
      auditLogs: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Seed concluido com ${companies.length} empresas.`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
