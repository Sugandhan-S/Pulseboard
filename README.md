# ⚡ PulseBoard

> **A beautifully crafted, blazing-fast task and activity board.**


[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-pulseboard--organizee.onrender.com-blue?style=for-the-badge)](https://pulseboard-organizee.onrender.com/)


PulseBoard delivers a premium, single-page application (SPA) experience **without** the complexity of heavy JavaScript frameworks. Built on the power of **HTMX, Node.js, Express, and PostgreSQL (Supabase)**, it demonstrates how you can achieve real-time interactivity, instant DOM swaps, and persistent data cloud hosting while keeping your business logic securely on the server.

👉 **Try the Live App:** [https://pulseboard-organizee.onrender.com/](https://pulseboard-organizee.onrender.com/)
---

## ✨ Why PulseBoard?

- 📌 **Frictionless Task Management** — Create, edit, and manage tasks via slick inline forms and modal overlays.
- 🏗️ **Project Contexts** — Neatly group your work by active or archived projects.
- 🔄 **Real-Time Interactivity** — Change task statuses and see dashboard stats update instantly via **HTMX Out-Of-Band (OOB)** swaps.
- 🔍 **Instant Search & Filters** — Find what you need with debounced search inputs and URL-synced filter states.
- 📊 **Dynamic KPI Dashboard** — Live stats that keep you on top of overdue and in-progress work.
- ⚡ **Global Activity Feed** — Every action is logged and reflected in a live feed.
- 🌐 **Persistent Cloud Data** — Cloud PostgreSQL integration via Supabase keeps data alive even when Render free apps spin down.

---

## 📸 Sneak Peek

![Dashboard Overview](./screenshots/dashboard.png)

![Activity Feed](./screenshots/activity.png)

---

## 🏗️ Architecture & Data Flow

PulseBoard uses a **server-rendered partial architecture**. The server owns all business logic and responds with small HTML fragments (instead of raw JSON). HTMX seamlessly swaps those fragments into the DOM without a full page refresh.

```mermaid
flowchart TD
    %% ==================== STYLES ====================
    classDef clientStyle fill:#0f172a,stroke:#38bdf8,color:#f8fafc,stroke-width:2px;
    classDef serverStyle fill:#1e1b4b,stroke:#818cf8,color:#f8fafc,stroke-width:2px;
    classDef routeStyle fill:#1e293b,stroke:#475569,color:#e2e8f0,stroke-width:1px;
    classDef dbStyle fill:#064e3b,stroke:#34d399,color:#f8fafc,stroke-width:2px;

    %% ==================== 1. CLIENT / USER ====================
    subgraph CLIENT[" 🌐 1. CLIENT LAYER (User Browser) "]
        direction LR
        UI["💻 User Interface / DOM"]
        HTMX["⚡ HTMX Engine\n(hx-get · hx-post · hx-put · hx-delete)"]
        UI <--> HTMX
    end

    %% ==================== 2. COMPACT SERVER LAYER ====================
    subgraph SERVER[" ⚙️ 2. SERVER LAYER (Node.js + Express) "]
        direction LR
        ROUTES["<b>1. Route Handlers</b><br/>/dashboard · /tasks<br/>/projects · /activity"] --> CTRL["<b>2. Controllers</b><br/>Business Logic &<br/>Validation"] --> VIEW["<b>3. View Engine</b><br/>EJS Templates +<br/>hx-swap-oob"]
    end

    %% ==================== 3. DATABASE ====================
    subgraph DATA[" 💾 3. DATA LAYER (Storage) "]
        direction TB
        DB_ENGINE[("PostgreSQL Database\n(Supabase / pg Pool)")]
        TABLES["Tables: projects · tasks · activity_logs · task_tags"]
        DB_ENGINE --- TABLES
    end

    %% ==================== SEQUENTIAL FLOW ====================
    HTMX -- "① HTTP Request" --> ROUTES
    CTRL -- "② SQL Queries" --> DB_ENGINE
    DB_ENGINE -- "③ Rows / Stats" --> CTRL
    VIEW -- "④ HTML Fragment + OOB Snippets" --> HTMX

    %% ==================== APPLY STYLES ====================
    class CLIENT clientStyle;
    class SERVER serverStyle;
    class DATA dbStyle;
    class ROUTES,CTRL,VIEW routeStyle;
```

> **Key insight:** Every HTMX action (creating a task, changing a status) sends a real HTTP request to Express. The server responds with a small HTML snippet — not JSON — which HTMX directly swaps into the DOM. No client-side state management needed.

---

## ⚔️ Architecture Comparison: React vs. PulseBoard

| Metric / Feature | Traditional React SPA | PulseBoard (HTMX + Express) |
| :--- | :--- | :--- |
| **Client JS Bundle** | ~300 KB – 1 MB+ | ~14 KB (HTMX CDN only) |
| **State Management** | Redux, Zustand, or Context API | Database & Server-rendered HTML |
| **Data Flow** | Client `fetch()` → JSON → Virtual DOM | Direct HTML Fragment Swaps |
| **Build Step** | Complex (Vite, Webpack, Babel) | Zero client build step |
| **SEO & Links** | Needs SSR / Hydration setup | Native HTML + `hx-push-url` |

---

## 🚀 Getting Started in 60 Seconds

Ready to try it locally?

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/pulseboard.git
cd pulseboard

# 2. Install dependencies
npm install

# 3. Configure your environment
cp .env.example .env
# Then open .env and set your Supabase connection string:
# DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# 4. Initialize the database schema (creates tables in Supabase)
npm run init-db

# 5. (Optional) Seed with sample projects and tasks
npm run seed

# 6. Ignite the server!
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and experience the speed.

> **Tip:** Get your free Supabase project at [supabase.com](https://supabase.com). Copy the connection string from **Project Settings → Database → Connection string (URI mode)**.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Server:** Express.js
- **Database:** PostgreSQL via [Supabase](https://supabase.com) (using the `pg` driver with connection pooling)
- **Frontend Interactivity:** HTMX 1.9
- **Templates:** EJS + express-ejs-layouts
- **Styling:** Vanilla CSS with custom properties (CSS variables)

---

## 🧠 The HTMX Magic (What I Learned)

PulseBoard is a masterclass in modern server-rendered architecture:
- **`hx-swap-oob`**: Update multiple UI elements (like KPI stats and the activity feed) from a single server response—no messy DOM manipulation in JavaScript!
- **Server-Rendered Partials**: EJS templates generate perfectly sized HTML fragments, keeping the frontend dumb and the backend smart.
- **URL-Driven State**: Using `hx-push-url`, filtering tasks updates the browser URL, making your current view fully bookmarkable.
- **Cloud-Persistent Data**: Backed by Supabase (PostgreSQL), data survives Render's free-tier spin-downs — no cold-start data loss.

---

## 📜 License

MIT
