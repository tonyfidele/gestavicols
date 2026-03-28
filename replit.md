# GESTAVICOLE

## Overview

GESTAVICOLE est une plateforme SaaS multi-tenant pour la gestion avicole (élevage de volailles). Elle comprend un système RBAC complet avec isolation par tenant, permissions granulaires, audit des actions et sécurité backend totale.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + TailwindCSS + Recharts
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server avec RBAC
│   └── gestavicole/        # Frontend React SaaS
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Seed script avec données de démo
```

## RBAC - Rôles et permissions

### Rôles disponibles
- **SUPER_ADMIN**: Accès total à tous les tenants
- **ADMIN**: CRUD complet pour son entreprise
- **CHEF_FERME**: Lecture farms/batches/stock, CRUD daily records
- **OUVRIER**: Création daily records, lecture batch/ferme
- **VETERINAIRE**: CRUD veterinary records, lecture batch
- **COMPTABLE**: CRUD expenses et sales, export rapports

### Sécurité
- JWT signé avec `SESSION_SECRET`
- Isolation stricte par `tenantId` (jamais depuis le frontend)
- Soft delete (`deletedAt`) sur toutes les entités
- Journal d'audit automatique pour chaque action sensible
- Middleware `withTenant()` pour filtrage automatique

## Schémas DB

- `tenants` - Entreprises SaaS
- `users` - Utilisateurs avec rôles (enum `user_role`)
- `farms` - Fermes avicoles
- `buildings` - Bâtiments dans les fermes
- `batches` - Lots de volailles (status: ACTIF/TERMINE/EN_ATTENTE)
- `daily_records` - Enregistrements journaliers (mortalité, aliment, eau)
- `sales` - Ventes
- `stock` - Inventaire (aliments, médicaments, équipements)
- `expenses` - Dépenses
- `veterinary_records` - Fiches vétérinaires
- `audit_logs` - Journal d'audit

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@gestavicole.com | password123 |
| Chef de ferme | chef@gestavicole.com | password123 |
| Ouvrier | ouvrier@gestavicole.com | password123 |
| Vétérinaire | vet@gestavicole.com | password123 |
| Comptable | comptable@gestavicole.com | password123 |

## Commandes utiles

```bash
# Démarrer l'API
pnpm --filter @workspace/api-server run dev

# Démarrer le frontend
pnpm --filter @workspace/gestavicole run dev

# Pousser le schéma DB
pnpm --filter @workspace/db run push

# Seed les données de démo
pnpm --filter @workspace/scripts run seed

# Régénérer les types depuis OpenAPI
pnpm --filter @workspace/api-spec run codegen
```

## Pages frontend

1. **Dashboard** - KPI, graphiques, alertes stock faible
2. **Fermes** - Gestion des fermes et bâtiments
3. **Lots** - Gestion des lots de volailles
4. **Ventes** - Suivi commercial
5. **Stock** - Inventaire avec alertes minimum
6. **Dépenses** - Comptabilité
7. **Utilisateurs** - Gestion équipe (ADMIN+)
8. **Journal d'audit** - Historique actions sensibles
