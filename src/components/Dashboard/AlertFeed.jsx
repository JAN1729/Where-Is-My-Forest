import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '../../data/referenceData';
import './AlertFeed.css';

// Sentiment color for alert significance
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

export default function AlertFeed({ alerts = [], isOpen, onClose, onAlertClick }) {
    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="alert-feed__overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`alert-feed ${isOpen ? 'alert-feed--open' : ''}`}
                initial={false}
                animate={{ x: isOpen ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="alert-feed__header">
                    <h2 className="alert-feed__title">Environment Alerts</h2>
                    <button className="alert-feed__close" onClick={onClose} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="alert-feed__list">
                    {alerts.length === 0 ? (
                        <p className="alert-feed__empty">No alerts yet. Negative news articles will appear here.</p>
                    ) : (
                        <AnimatePresence initial={false}>
                            {alerts.slice(0, 30).map((alert, i) => (
                                <motion.div
                                    key={alert.id}
                                    className="alert-feed__item"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => onAlertClick?.(alert)}
                                    style={{ '--severity-color': getSentimentColor(alert.sentiment) }}
                                >
                                    <div className="alert-feed__item-bar" />
                                    <div className="alert-feed__item-content">
                                        <span className="alert-feed__item-type">
                                            {getCategoryLabel(alert.category)}
                                        </span>
                                        <span className="alert-feed__item-location">
                                            {alert.title}
                                        </span>
                                        <span className="alert-feed__item-time">
                                            {alert.state || 'India'} · {formatTimeAgo(alert.published_at)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.aside>
        </>
    );
}
