<div align="center">
  <img src="public/logo.png" alt="Where Is My Forest Logo" width="120" />
  <h1>Where Is My Forest 🌲</h1>
  <p><strong>A Real-Time Deforestation Tracking & Community Reforestation Platform for India</strong></p>
</div>

<br />

**Where Is My Forest** is an open-source platform designed to bring transparency to India's forest cover, track environmental incidents in real-time, and encourage community-driven reforestation through AI-verified tree planting.

## ✨ Features

- 🗺️ **Interactive Geographic Tracking:** View state-wise forest data (ISFR statistics), protected areas, and live incident heatmaps using Leaflet.
- 🚨 **Live Incident Reporting:** Community-submitted reports for illegal logging, forest fires, wildlife poaching, and pollution.
- 🌱 **AI-Verified Reforestation:** Users can upload photos of newly planted trees, which are validated in real-time by a multimodal AI model (via OpenRouter) before being added to the public map.
- 📰 **Real-Time Environmental News:** Curated, AI-summarized news feed regarding forest policy, conservation, and deforestation trends.
- 🔒 **Secure by Design:** Built with strict Supabase Row Level Security (RLS), IP-based rate limiting on edge functions, and payload validation.

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts, React Leaflet
- **Backend (BaaS):** Supabase (PostgreSQL, Realtime, Storage, Edge Functions)
- **AI Integration:** OpenRouter (Gemini 2.0 Flash) for image verification
- **Integrations:** GFW (Global Forest Watch), NASA FIRMS (via Edge Functions/Cron)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com) account
- An [OpenRouter](https://openrouter.ai) API key

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/WhereIsMyForest.git
   cd WhereIsMyForest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Supabase Database:**
   - Go to your Supabase Dashboard -> **SQL Editor**.
   - Copy the contents of `supabase/schema.sql` and run it to create the tables, RLS policies, storage buckets, and seed data.

5. **Deploy Supabase Edge Functions:**
   First, set your OpenRouter secret in Supabase:
   ```bash
   npx supabase secrets set OPENROUTER_API_KEY=your_openrouter_key
   ```
   Then deploy the verification function:
   ```bash
   npx supabase functions deploy verify-tree-photo --no-verify-jwt
   ```

6. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome! If you're passionate about the environment and open-source software, feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is open-source and available under the MIT License.
