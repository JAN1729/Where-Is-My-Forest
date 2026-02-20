import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForestMap from '../components/Map/ForestMap';
import AlertFeed from '../components/Dashboard/AlertFeed';
import AlertPopup from '../components/Dashboard/AlertPopup';
import LiquidGlass from '../components/common/LiquidGlass';
import { useAlerts } from '../hooks/useAlerts';
import { useNews } from '../hooks/useNews';
import { formatTimeAgo } from '../data/referenceData';
import { fetchVerifiedTrees, subscribeToTable } from '../lib/supabase';
import './Dashboard.css';

// Sentiment-based color
function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'negative': return '#C1121F';
        case 'positive': return '#2D6A4F';
        default: return '#3A86FF';
    }
}

function getCategoryLabel(category) {
    switch (category) {
        case 'deforestation': return 'Deforestation';
        case 'fire': return 'Fire';
        case 'wildlife': return 'Wildlife';
        case 'pollution': return 'Pollution';
        case 'policy': return 'Policy';
        case 'conservation': return 'Conservation';
        default: return 'News';
    }
}

export default function Dashboard() {
    const { alerts, loading: alertsLoading, newAlertCount, latestAlert, clearNewAlertCount, dismissLatestAlert } = useAlerts();
    const { news } = useNews();
    const [alertFeedOpen, setAlertFeedOpen] = useState(false);
    const [flyToPosition, setFlyToPosition] = useState(null);
    const [activeTab, setActiveTab] = useState('alerts');
    const [plantedTrees, setPlantedTrees] = useState([]);

    // Fetch community planted trees for map display & subscribe to updates
    useEffect(() => {
        fetchVerifiedTrees().then(setPlantedTrees);

        // Real-time subscription for instant updates
        const unsubscribe = subscribeToTable('planted_trees', (payload) => {
            const { new: newTree, eventType } = payload;

            // If a new tree is verified (inserted or updated)
            if (newTree && newTree.status === 'verified') {
                setPlantedTrees(prev => {
                    // Avoid duplicates
                    if (prev.some(t => t.id === newTree.id)) return prev;
                    return [newTree, ...prev];
                });
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const handleNewsClick = useCallback((article) => {
        if (article.latitude && article.longitude) {
            setFlyToPosition([article.latitude, article.longitude]);
            setTimeout(() => setFlyToPosition(null), 2000);
        }
    }, []);

    const handleAlertClick = useCallback((alert) => {
        if (alert.latitude && alert.longitude) {
            setFlyToPosition([alert.latitude, alert.longitude]);
            setTimeout(() => setFlyToPosition(null), 2000);
        }
    }, []);

    const toggleAlertFeed = useCallback(() => {
        setAlertFeedOpen(prev => !prev);
        clearNewAlertCount();
    }, [clearNewAlertCount]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="dashboard">
            {/* Status Bar / Ticker Container */}
            <div className="dashboard__status-bar">
                {/* Premium Minimal Ticker Banner (Replaces "Live Data..." text) */}
                <div className="dashboard__ticker-wrap">
                    <div className="dashboard__ticker-bg">
                        <div className="dashboard__ticker-orb-1"></div>
                        <div className="dashboard__ticker-orb-2"></div>
                    </div>
                    <LiquidGlass overLight={true} displacementScale={20} blurAmount={0.04} cornerRadius={999} padding="0px 16px">
                        <div className="dashboard__ticker">
                            <span className="dashboard__ticker-content">
                                Welcome to Where Is My Forest
                                <span>●</span> Track and monitor real-time deforestation, wildfires, and illegal activity
                                <span>●</span> Report environmental incidents instantly to mobilize verified conservation efforts
                                <span>●</span> Plant real trees dynamically and watch our community forest grow on the map
                                <span>●</span> Explore live data analytics to empower wildlife protection and local climate action
                            </span>
                        </div>
                    </LiquidGlass>
                </div>

                <div className="dashboard__quick-actions">
                    <a href="/report" className="dashboard__action-btn dashboard__action-btn--report">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Report Incident
                    </a>
                    <a href="/resources" className="dashboard__action-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        Resources
                    </a>
                    <a href="/analytics" className="dashboard__action-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        Analytics
                    </a>
                </div>
            </div>

            {/* Split Panel: Map Left + Info Right — fills viewport */}
            <div className="dashboard__split">
                {/* Left: Map */}
                <motion.div
                    className="dashboard__map-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <ForestMap
                        news={news}
                        plantedTrees={plantedTrees}
                        flyToPosition={flyToPosition}
                        onNewsClick={handleNewsClick}
                    />
                </motion.div>

                {/* Right: Info Panel */}
                <motion.div
                    className="dashboard__info-panel"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {/* Tab switcher */}
                    <div className="dashboard__tabs">
                        <button
                            className={`dashboard__tab ${activeTab === 'alerts' ? 'dashboard__tab--active' : ''}`}
                            onClick={() => setActiveTab('alerts')}
                        >
                            Alerts
                            {alerts.length > 0 && <span className="dashboard__tab-count">{alerts.length}</span>}
                        </button>
                        <button
                            className={`dashboard__tab ${activeTab === 'news' ? 'dashboard__tab--active' : ''}`}
                            onClick={() => setActiveTab('news')}
                        >
                            Media
                            {news.length > 0 && <span className="dashboard__tab-count">{news.length}</span>}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="dashboard__tab-content">
                        <AnimatePresence mode="wait">
                            {activeTab === 'alerts' ? (
                                <motion.div
                                    key="alerts"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="dashboard__alert-list"
                                >
                                    {alerts.length === 0 ? (
                                        <div className="dashboard__empty">
                                            <div className="dashboard__empty-icon">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--black-faint)" strokeWidth="1.5">
                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </div>
                                            <p>No active alerts</p>
                                            <span>Conservation alerts will appear here as events are detected</span>
                                        </div>
                                    ) : (
                                        alerts.slice(0, 20).map((alert, i) => (
                                            <motion.div
                                                key={alert.id || i}
                                                className="dashboard__alert-item"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => handleAlertClick(alert)}
                                                style={{ '--severity': getSentimentColor(alert.sentiment) }}
                                            >
                                                <div className="dashboard__alert-dot" />
                                                <div className="dashboard__alert-info">
                                                    <span className="dashboard__alert-type">{getCategoryLabel(alert.category)}</span>
                                                    <span className="dashboard__alert-location">{alert.title}</span>
                                                </div>
                                                <div className="dashboard__alert-meta">
                                                    <span className="dashboard__alert-severity"
                                                        style={{ color: getSentimentColor(alert.sentiment) }}
                                                    >
                                                        {alert.state || 'India'}
                                                    </span>
                                                    <span className="dashboard__alert-time">{formatTimeAgo(alert.published_at)}</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="news"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="dashboard__news-list"
                                >
                                    {news.length === 0 ? (
                                        <div className="dashboard__empty">
                                            <div className="dashboard__empty-icon">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--black-faint)" strokeWidth="1.5">
                                                    <path d="M4 22h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v16l-4 4z" />
                                                </svg>
                                            </div>
                                            <p>No media reports</p>
                                            <span>News articles will populate as data sources are connected</span>
                                        </div>
                                    ) : (
                                        news.slice(0, 15).map((article, i) => (
                                            <motion.a
                                                key={article.id || i}
                                                className="dashboard__news-item"
                                                href={article.source_url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <div className="dashboard__news-category" style={{ background: `${getSentimentColor(article.sentiment)}15` }}>
                                                    <span style={{ color: getSentimentColor(article.sentiment) }}>
                                                        {getCategoryLabel(article.category)}
                                                    </span>
                                                </div>
                                                <h4 className="dashboard__news-title">{article.title}</h4>
                                                <div className="dashboard__news-meta">
                                                    <span>{article.state || article.source_name}</span>
                                                    <span>{formatTimeAgo(article.published_at)}</span>
                                                </div>
                                            </motion.a>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Mobile FAB */}
            <button className="dashboard__fab" onClick={toggleAlertFeed}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {newAlertCount > 0 && (
                    <span className="dashboard__fab-count">{newAlertCount > 9 ? '9+' : newAlertCount}</span>
                )}
            </button>

            {/* Mobile Alert Feed */}
            <AlertFeed
                alerts={alerts}
                isOpen={alertFeedOpen}
                onClose={() => setAlertFeedOpen(false)}
                onAlertClick={handleAlertClick}
            />

            <AlertPopup alert={latestAlert} onDismiss={dismissLatestAlert} />
        </div>
    );
}
