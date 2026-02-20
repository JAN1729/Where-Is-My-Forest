import { motion } from 'framer-motion';
import './About.css';

export default function About() {
    return (
        <div className="about">
            <motion.div
                className="about__hero"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="about__hero-icon">🌳</span>
                <h1 className="about__hero-title">Where is My Forest</h1>
                <p className="about__hero-subtitle">
                    A real-time monitoring platform tracking India's forest cover,
                    deforestation alerts, and environmental news
                </p>
            </motion.div>

            <div className="about__grid">
                <motion.div className="about__card solid-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
                    <h3>Our Mission</h3>
                    <p>
                        To bring transparency to forest conservation by providing real-time,
                        accessible data about deforestation, fires, and environmental incidents
                        across India. Awareness is the first step toward action.
                    </p>
                </motion.div>

                <motion.div className="about__card solid-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                    <h3>Data Sources</h3>
                    <p>
                        We aggregate satellite-based monitoring from Global Forest Watch (GLAD alerts),
                        NASA FIRMS fire detection, and India's Forest Survey reports —
                        combined with AI-curated environmental news.
                    </p>
                </motion.div>

                <motion.div className="about__card solid-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                    <h3>AI-Powered Analysis</h3>
                    <p>
                        Our AI engine processes incoming news to extract location data,
                        categorize incidents, determine sentiment, and generate actionable
                        summaries — fully automated with no manual curation.
                    </p>
                </motion.div>

                <motion.div className="about__card solid-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                    <h3>Security First</h3>
                    <p>
                        All API keys and credentials are stored server-side in Supabase
                        Edge Functions. The frontend never exposes any secrets.
                        All data flows through authenticated channels.
                    </p>
                </motion.div>
            </div>

            <motion.div
                className="about__tech solid-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <h3>Technology</h3>
                <div className="about__tech-grid">
                    <div className="about__tech-item">
                        <strong>React + Vite</strong>
                        <p>Modern frontend framework</p>
                    </div>
                    <div className="about__tech-item">
                        <strong>Leaflet.js</strong>
                        <p>Interactive mapping</p>
                    </div>
                    <div className="about__tech-item">
                        <strong>Recharts</strong>
                        <p>Data visualization</p>
                    </div>
                    <div className="about__tech-item">
                        <strong>Supabase</strong>
                        <p>Database, auth, and realtime</p>
                    </div>
                    <div className="about__tech-item">
                        <strong>Edge Functions</strong>
                        <p>Secure API proxy layer</p>
                    </div>
                    <div className="about__tech-item">
                        <strong>Framer Motion</strong>
                        <p>Smooth animations</p>
                    </div>
                </div>
            </motion.div>

            <motion.footer
                className="about__footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            >
                <p className="about__footer-tagline">Built for India's forests</p>
                <p className="about__footer-copy">2026 Where is My Forest. All rights reserved.</p>
            </motion.footer>
        </div>
    );
}
