# OdontoClínica

Sistema de gestão para clínica odontológica: prontuário eletrônico, agenda, orçamentos/planos de tratamento e financeiro.

**Stack:** Next.js 15 (App Router, Server Actions) · TypeScript · Prisma · PostgreSQL · Tailwind CSS 4

## Rodando localmente

```bash
docker compose up -d          # PostgreSQL na porta 5432
cp .env.example .env          # ajuste AUTH_SECRET
npm install
npm run db:migrate            # cria as tabelas
npm run db:seed               # usuários, procedimentos e pacientes de exemplo
npm run dev                   # http://localhost:3000
```

Usuários de exemplo:

| E-mail                 | Perfil        |
| ---------------------- | ------------- |
| admin@clinica.com      | Administrador |
| ana@clinica.com        | Dentista      |
| bruno@clinica.com      | Dentista      |
| recepcao@clinica.com   | Recepção      |

> O servidor usa o fuso horário da máquina para a agenda. Em produção, defina `TZ=America/Sao_Paulo` no ambiente do processo.

## Módulos

- **Pacientes** — cadastro, busca por nome/CPF/telefone, responsável legal para menores.
- **Prontuário**
  - Anamnese versionada (cada preenchimento gera uma nova versão) com alertas e alergias em destaque.
  - Odontograma interativo (FDI, permanentes e decíduos), marcação por face.
  - Evolução clínica somente-inclusão (não pode ser editada nem apagada).
  - Exames e anexos (radiografias, fotos, PDFs) servidos apenas a usuários autorizados.
- **Agenda** — visão diária por dentista, detecção de conflito de horário, fluxo de status
  (agendado → confirmado → aguardando → em atendimento → atendido / faltou / cancelado),
  link de confirmação por WhatsApp.
- **Orçamentos** — plano de tratamento por dente/face, desconto, impressão/PDF para assinatura,
  aprovação gera as parcelas; marcar um procedimento como realizado registra a evolução automaticamente.
- **Financeiro** — contas a receber, baixa por forma de pagamento, inadimplência, despesas,
  saldo do mês e comissão por dentista (sobre procedimentos realizados).
- **Estoque** — produtos com estoque mínimo e alerta de reposição, entradas/saídas/ajustes,
  histórico de movimentações. Cada procedimento pode ter sua lista de materiais (ex.: cirurgia
  usa 4 gazes); ao marcar o procedimento como realizado, os materiais são baixados automaticamente.

## Perfis de acesso

|                         | Admin | Dentista | Recepção |
| ----------------------- | :---: | :------: | :------: |
| Agenda e cadastro       |   ✓   |    ✓     |    ✓     |
| Dados clínicos          |   ✓   |    ✓     |          |
| Orçamentos              |   ✓   |    ✓     |    ✓     |
| Financeiro              |   ✓   |          |    ✓     |
| Estoque (movimentar)    |   ✓   |    ✓     |    ✓     |
| Produtos e materiais    |   ✓   |    ✓     |          |
| Procedimentos/usuários  |   ✓   |          |          |

Acessos a dados clínicos e alterações relevantes ficam registrados na tabela `AuditLog` (LGPD).
