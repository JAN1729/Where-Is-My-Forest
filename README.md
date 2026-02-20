<div align="center">
  
  <h1>Where Is My Forest 🌲</h1>
  <p><strong>A Real-Time Deforestation Tracking & Community Reforestation Platform for Conseration Developers.</strong></p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react" alt="React" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Backend_as_a_Service-3ECF8E.svg?style=flat&logo=supabase" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?style=flat&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-Fast_Build_Tool-646CFF.svg?style=flat&logo=vite" alt="Vite" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
    <a href="https://github.com/YourUsername/WhereIsMyForest/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" /></a>
  </p>
</div>

<br />

**Where Is My Forest** is an open-source platform built by and for environmental conservation developers. Our goal is to bring radical transparency to forest cover data, track environmental incidents in real-time, and encourage community-driven reforestation using AI-verified tracking.

If you are a developer passionate about climate tech, GIS, or open-source, we need your help to build the ultimate tool for forest conservation.

## ✨ Why Contribute to This Project?

We are building a robust, modern stack that tackles real-world environmental problems:
- 🗺️ **Interactive Geographic Tracking:** Visualizing state-wise forest data and live incident heatmaps using `Leaflet`.
- 🚨 **Live Incident Reporting:** A crowdsourced platform for illegal logging, forest fires, wildlife poaching, and pollution.
- 🌱 **AI-Verified Reforestation:** Multi-modal AI validation (via OpenRouter & Gemini) of community-planted trees.
- 📰 **Real-Time Data Pipelines:** Edge functions orchestrating pipelines from Global Forest Watch (GFW), NASA FIRMS, and NewsData.io.

---

## 🏗️ System Architecture

Our platform follows a modern, decoupled architecture designed for scale and rapid contribution:

- **Frontend (Client):** `React 19` + `Vite` for ultra-fast HMR and building. Styling powered by `Tailwind CSS`, animations by `Framer Motion`, and charts by `Recharts`.
- **Backend (BaaS):** `Supabase` is the core of our data layer.
  - **Database:** PostgreSQL with strict Row Level Security (RLS).
  - **Realtime:** Subscriptions for live incident updates.
  - **Storage:** Secure buckets for tree photo uploads.
  - **Edge Functions:** Deno-based serverless functions for fetching satellite data and running AI validations.
- **External Integrations:** OpenRouter API (AI image validation), NASA FIRMS (Active Fire Data).

---

## 🚀 Idiot-Proof Local Setup

We've made it extremely easy to get this running locally. Follow these steps to spin up your environment in under 5 minutes.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A free [Supabase](https://supabase.com) account
- A free [OpenRouter](https://openrouter.ai) API key (for the AI verification feature)

### 2. Clone and Install
```bash
git clone https://github.com/YourUsername/WhereIsMyForest.git
cd WhereIsMyForest
npm install
```

### 3. Environment Variables
Copy the example environment file and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Update `.env` with your Supabase URL and Anon Key (found in your Supabase project settings -> API).

### 4. Database Setup
1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Copy the entire contents of `supabase/schema.sql` and run it. This script is idempotent and will automatically create all tables, RLS policies, storage buckets, and seed data.

### 5. Start Hacking!
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

---

## 🤝 Contributing

We welcome all conservation-minded developers! Whether it's fixing a bug, adding a new GIS layer, or optimizing our queries, your contributions matter.

Read our [Contributing Guidelines](CONTRIBUTING.md) to understand our workflow, branch naming conventions, and how to submit a stellar Pull Request.

---

## 🐞 Found a Bug or Have an Idea?

- **Bugs:** Please open an issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).
- **Features:** Have an idea for a new data integration? Open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md).

## 📄 License

This project is open-source under the [MIT License](LICENSE). Build something beautiful and save the forests.
