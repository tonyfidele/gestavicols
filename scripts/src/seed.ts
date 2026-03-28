import { db } from "@workspace/db";
import {
  tenantsTable,
  usersTable,
  farmsTable,
  buildingsTable,
  batchesTable,
  salesTable,
  stockTable,
  expensesTable,
  dailyRecordsTable,
} from "@workspace/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding GESTAVICOLE database...");

  const existingTenant = await db.select().from(tenantsTable).limit(1);
  if (existingTenant.length > 0) {
    console.log("✅ Database already seeded. Skipping.");
    process.exit(0);
  }

  const tenantId = randomUUID();
  const [tenant] = await db.insert(tenantsTable).values({
    id: tenantId,
    name: "Avicole du Sahel SA",
    slug: "avicole-sahel",
  }).returning();
  console.log(`✅ Created tenant: ${tenant.name}`);

  const passwordHash = await bcrypt.hash("password123", 12);

  const users = [
    { id: randomUUID(), email: "admin@gestavicole.com", name: "Moussa Diallo", role: "ADMIN" as const },
    { id: randomUUID(), email: "chef@gestavicole.com", name: "Fatou Traoré", role: "CHEF_FERME" as const },
    { id: randomUUID(), email: "ouvrier@gestavicole.com", name: "Ibrahima Koné", role: "OUVRIER" as const },
    { id: randomUUID(), email: "vet@gestavicole.com", name: "Dr. Aminata Bah", role: "VETERINAIRE" as const },
    { id: randomUUID(), email: "comptable@gestavicole.com", name: "Mariama Camara", role: "COMPTABLE" as const },
  ];

  for (const user of users) {
    await db.insert(usersTable).values({ ...user, passwordHash, tenantId });
  }
  console.log(`✅ Created ${users.length} users`);

  const farmId1 = randomUUID();
  const farmId2 = randomUUID();
  await db.insert(farmsTable).values([
    {
      id: farmId1,
      name: "Ferme Principale - Kaloum",
      location: "Kaloum, Conakry",
      capacity: 50000,
      tenantId,
      managerId: users[1].id,
    },
    {
      id: farmId2,
      name: "Ferme Nord - Ratoma",
      location: "Ratoma, Conakry",
      capacity: 30000,
      tenantId,
    },
  ]);
  console.log("✅ Created 2 farms");

  const buildingId1 = randomUUID();
  const buildingId2 = randomUUID();
  const buildingId3 = randomUUID();
  await db.insert(buildingsTable).values([
    { id: buildingId1, name: "Bâtiment A", farmId: farmId1, type: "Poulet de chair", capacity: 20000 },
    { id: buildingId2, name: "Bâtiment B", farmId: farmId1, type: "Poule pondeuse", capacity: 15000 },
    { id: buildingId3, name: "Bâtiment C", farmId: farmId2, type: "Poulet de chair", capacity: 25000 },
  ]);
  console.log("✅ Created 3 buildings");

  const batchId1 = randomUUID();
  const batchId2 = randomUUID();
  const batchId3 = randomUUID();
  await db.insert(batchesTable).values([
    {
      id: batchId1,
      name: "Lot Broilers Jan-2026",
      farmId: farmId1,
      buildingId: buildingId1,
      tenantId,
      species: "Broilers (Cobb 500)",
      initialCount: 18000,
      currentCount: 17250,
      status: "ACTIF",
      startDate: "2026-01-15",
      mortalityRate: 4.17,
    },
    {
      id: batchId2,
      name: "Lot Pondeuses Fév-2026",
      farmId: farmId1,
      buildingId: buildingId2,
      tenantId,
      species: "Poules pondeuses (ISA Brown)",
      initialCount: 12000,
      currentCount: 11800,
      status: "ACTIF",
      startDate: "2026-02-01",
      mortalityRate: 1.67,
    },
    {
      id: batchId3,
      name: "Lot Broilers Mar-2026",
      farmId: farmId2,
      buildingId: buildingId3,
      tenantId,
      species: "Broilers (Ross 308)",
      initialCount: 22000,
      currentCount: 21500,
      status: "ACTIF",
      startDate: "2026-03-01",
      mortalityRate: 2.27,
    },
  ]);
  console.log("✅ Created 3 batches");

  await db.insert(dailyRecordsTable).values([
    { id: randomUUID(), batchId: batchId1, date: "2026-03-20", mortality: 15, feedConsumption: 900, waterConsumption: 1800, averageWeight: 1.85, recordedBy: users[2].id },
    { id: randomUUID(), batchId: batchId1, date: "2026-03-21", mortality: 12, feedConsumption: 950, waterConsumption: 1900, averageWeight: 1.92, recordedBy: users[2].id },
    { id: randomUUID(), batchId: batchId1, date: "2026-03-22", mortality: 8, feedConsumption: 1000, waterConsumption: 2000, averageWeight: 1.98, recordedBy: users[2].id },
    { id: randomUUID(), batchId: batchId2, date: "2026-03-22", mortality: 3, feedConsumption: 600, waterConsumption: 1200, recordedBy: users[2].id },
  ]);
  console.log("✅ Created daily records");

  await db.insert(salesTable).values([
    { id: randomUUID(), tenantId, batchId: batchId1, quantity: 2000, unitPrice: 4500, totalAmount: 9000000, buyerName: "SOPROKA SARL", saleDate: "2026-03-01", type: "Vente poulets vifs" },
    { id: randomUUID(), tenantId, batchId: batchId1, quantity: 1500, unitPrice: 4800, totalAmount: 7200000, buyerName: "Marché Central", saleDate: "2026-03-10", type: "Vente poulets vifs" },
    { id: randomUUID(), tenantId, quantity: 5000, unitPrice: 120, totalAmount: 600000, buyerName: "Restaurants Kaloum", saleDate: "2026-03-15", type: "Vente oeufs", batchId: batchId2 },
    { id: randomUUID(), tenantId, batchId: batchId3, quantity: 3000, unitPrice: 4200, totalAmount: 12600000, buyerName: "GFC Distribution", saleDate: "2026-03-20", type: "Vente poulets vifs" },
  ]);
  console.log("✅ Created sales");

  await db.insert(stockTable).values([
    { id: randomUUID(), tenantId, name: "Aliment démarrage", category: "Aliment", quantity: 15000, unit: "kg", minimumLevel: 5000, unitPrice: 650 },
    { id: randomUUID(), tenantId, name: "Aliment croissance", category: "Aliment", quantity: 8000, unit: "kg", minimumLevel: 10000, unitPrice: 600 },
    { id: randomUUID(), tenantId, name: "Aliment finition", category: "Aliment", quantity: 20000, unit: "kg", minimumLevel: 5000, unitPrice: 550 },
    { id: randomUUID(), tenantId, name: "Vaccin Newcastle", category: "Médicament", quantity: 50, unit: "flacon", minimumLevel: 20, unitPrice: 15000 },
    { id: randomUUID(), tenantId, name: "Vitamine AD3E", category: "Médicament", quantity: 25, unit: "litre", minimumLevel: 10, unitPrice: 45000 },
    { id: randomUUID(), tenantId, name: "Désinfectant", category: "Produit vétérinaire", quantity: 3, unit: "bidon 20L", minimumLevel: 5, unitPrice: 85000 },
  ]);
  console.log("✅ Created stock items");

  await db.insert(expensesTable).values([
    { id: randomUUID(), tenantId, category: "Alimentation", description: "Achat aliment démarrage - Lot Jan", amount: 4500000, date: "2026-01-15", batchId: batchId1 },
    { id: randomUUID(), tenantId, category: "Médicaments", description: "Vaccination Newcastle - Lot Jan", amount: 750000, date: "2026-01-20", batchId: batchId1 },
    { id: randomUUID(), tenantId, category: "Alimentation", description: "Achat aliment croissance", amount: 3200000, date: "2026-02-10", farmId: farmId1 },
    { id: randomUUID(), tenantId, category: "Électricité", description: "Facture électricité février", amount: 850000, date: "2026-02-28", farmId: farmId1 },
    { id: randomUUID(), tenantId, category: "Main d'oeuvre", description: "Salaires ouvriers mars", amount: 2400000, date: "2026-03-01" },
    { id: randomUUID(), tenantId, category: "Carburant", description: "Gasoil générateur mars", amount: 420000, date: "2026-03-15" },
  ]);
  console.log("✅ Created expenses");

  console.log("\n🎉 Seed complete!");
  console.log("\nComptes de connexion:");
  console.log("  Admin:      admin@gestavicole.com / password123");
  console.log("  Chef ferme: chef@gestavicole.com / password123");
  console.log("  Ouvrier:    ouvrier@gestavicole.com / password123");
  console.log("  Vétérinaire: vet@gestavicole.com / password123");
  console.log("  Comptable:  comptable@gestavicole.com / password123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
