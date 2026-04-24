# Lemeone-Lab 2.0: Business Gravity Sandbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DRTA Engine](https://img.shields.io/badge/Engine-DRTA--2.5-blue)](https://github.com/penghaidong/lemeone-lab)

**Lemeone-Lab 2.0** is a commercial decision support system based on emergent swarm intelligence and 14D vector collisions. It simulates 100,000 logically consistent virtual agents in instantaneous market steps (Epochs) to perform deterministic risk audits on product requirements.

## 🚀 Core Features

- **14D DNA Model**: Comprehensive modeling of products across 14 dimensions (Core, Monetization, Market Dynamics, Strategy, and Awareness).
- **Gravity vs. Weather**: Structural industry DNA (Gravity) interacts with real-time news perturbations (Weather) via Gemini Search.
- **DRTA 2.5 Engine**: High-fidelity resonance-based simulation of user conversion, retention, and survival.
- **Interactive Terminal UI**: A high-speed command-line interface for business modeling and audit generation.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **AI**: Google AI SDK (Gemini 3.1 Flash)
- **Database**: PostgreSQL with `pgvector` (via Prisma)
- **UI**: Xterm.js (Terminal), Tailwind CSS

---

## 🏁 Getting Started

Follow these steps to deploy Lemeone-Lab on your local machine.

### 1. Prerequisites
- **Node.js** (v20 or higher)
- **NPM** or **PNPM**
- **Git**

### 2. Clone & Install
```bash
git clone https://github.com/penghaidong/lemeone-lab.git
cd lemeone-lab
npm install
```

### 3. Database Setup (Supabase)
This project requires PostgreSQL with the `vector` extension. The easiest way is using [Supabase](https://supabase.com):
1. Create a new project on Supabase.
2. In the **SQL Editor**, run `CREATE EXTENSION IF NOT EXISTS vector;`.
3. Go to **Project Settings > Database** and copy the **Connection String** (Transaction mode and Session mode).

### 4. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):
```bash
cp .env.example .env
```
Fill in the following variables:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Get it from [Google AI Studio](https://aistudio.google.com/).
- `DATABASE_URL`: Your Supabase connection string.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.

### 5. Initialize Database
Run Prisma migrations to set up the schema:
```bash
npx prisma db push
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to enter the lab.

---

## 📜 Core Commands (In Terminal UI)

- `project new "<name>"`: Create a new project case.
- `scan "<description>"`: Map a requirement to the 14D vector space.
- `price <amount>`: Set product pricing.
- `dev`: Advance the simulation by one week (Vector Collision).
- `audit`: Generate a deep strategic audit report.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Note**: The core DRTA algorithm is integrated via the `@lemeone/drta-engine` package to ensure consistent cross-platform simulation physics.
