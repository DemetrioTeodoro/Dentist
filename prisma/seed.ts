import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("senha123", 10);

  const users = [
    { name: "Administrador", email: "admin@clinica.com", role: "ADMIN" as const },
    {
      name: "Dra. Ana Souza",
      email: "ana@clinica.com",
      role: "DENTIST" as const,
      cro: "CRO-SP 12345",
      color: "#8b5cf6",
      commissionPct: 40,
    },
    {
      name: "Dr. Bruno Lima",
      email: "bruno@clinica.com",
      role: "DENTIST" as const,
      cro: "CRO-SP 67890",
      color: "#10b981",
      commissionPct: 35,
    },
    { name: "Carla Recepção", email: "recepcao@clinica.com", role: "RECEPTION" as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  const procedures = [
    { code: "81000065", name: "Consulta odontológica inicial", price: 150, durationMin: 30 },
    { code: "84000198", name: "Profilaxia (limpeza)", price: 180, durationMin: 40 },
    { code: "85100196", name: "Restauração em resina (1 face)", price: 220, durationMin: 40 },
    { code: "85100200", name: "Restauração em resina (2 faces)", price: 280, durationMin: 50 },
    { code: "85200034", name: "Tratamento endodôntico (canal) unirradicular", price: 800, durationMin: 90 },
    { code: "85200042", name: "Tratamento endodôntico (canal) multirradicular", price: 1200, durationMin: 120 },
    { code: "82000174", name: "Exodontia simples", price: 250, durationMin: 40 },
    { code: "85400017", name: "Coroa total em cerâmica", price: 1800, durationMin: 60 },
    { code: "82001715", name: "Implante dentário", price: 3500, durationMin: 120 },
    { code: "87000016", name: "Clareamento dental (consultório)", price: 900, durationMin: 60 },
  ];
  for (const p of procedures) {
    await prisma.procedure.upsert({ where: { code: p.code }, update: {}, create: p });
  }

  if ((await prisma.patient.count()) === 0) {
    await prisma.patient.createMany({
      data: [
        { name: "Maria Oliveira", cpf: "123.456.789-09", phone: "(11) 98888-1111", birthDate: new Date("1985-03-12") },
        { name: "João Pereira", cpf: "987.654.321-00", phone: "(11) 97777-2222", birthDate: new Date("1992-07-30") },
        { name: "Lucas Santos", phone: "(11) 96666-3333", birthDate: new Date("2015-11-02"), responsible: "Paula Santos (mãe)" },
      ],
    });
  }
}

main()
  .then(() => console.log("Seed concluído."))
  .finally(() => prisma.$disconnect());
