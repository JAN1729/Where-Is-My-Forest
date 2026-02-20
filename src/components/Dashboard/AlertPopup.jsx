import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '../../data/referenceData';
import './AlertPopup.css';

function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'negative': return '#C1121F';
        case 'positive': return '#2D6A4F';
        default: return '#3A86FF';
    }
}

function getCategoryIcon(category) {
    switch (category) {
        case 'deforestation': return 'DEF';
        case 'fire': return 'FIR';
        case 'wildlife': return 'WLD';
        case 'pollution': return 'POL';
        case 'conservation': return 'CON';
        case 'policy': return 'GOV';
        default: return 'NWS';
    }
}

export default function AlertPopup({ alert, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (alert) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => onDismiss?.(), 400);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [alert, onDismiss]);

    return (
        <AnimatePresence>
            {visible && alert && (
                <motion.div
                    className="alert-popup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="alert-popup__card"
                        initial={{ scale: 0.85, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.85, y: 30 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    >
                        <div
                            className="alert-popup__severity-strip"
                            style={{ background: getSentimentColor(alert.sentiment) }}
                        />

                        <div className="alert-popup__body">
                            <div className="alert-popup__header">
                                <span className="alert-popup__type" style={{ color: getSentimentColor(alert.sentiment) }}>
                                    {getCategoryIcon(alert.category)} {alert.category}
                                </span>
                                <span className="alert-popup__severity">{alert.sentiment}</span>
                            </div>

                            <h3 className="alert-popup__location">{alert.title}</h3>

                            <div className="alert-popup__details">
                                {alert.state && (
                                    <div className="alert-popup__detail">
                                        <span className="alert-popup__detail-label">Location</span>
                                        <span className="alert-popup__detail-value">{alert.state}</span>
                                    </div>
                                )}
                                <div className="alert-popup__detail">
                                    <span className="alert-popup__detail-label">Published</span>
                                    <span className="alert-popup__detail-value">{formatTimeAgo(alert.published_at)}</span>
                                </div>
                                <div className="alert-popup__detail">
                                    <span className="alert-popup__detail-label">Source</span>
                                    <span className="alert-popup__detail-value">{alert.source_name || 'News'}</span>
                                </div>
                            </div>

                            {alert.source_url && (
                                <a href={alert.source_url} target="_blank" rel="noopener noreferrer"
                                    className="alert-popup__link">
                                    Read full article →
                                </a>
                            )}

                            <button className="alert-popup__dismiss" onClick={() => { setVisible(false); onDismiss?.(); }}>
                                Dismiss
                            </button>
                        </div>

                        {/* Timer bar */}
                        <motion.div
                            className="alert-popup__timer"
                            style={{ background: getSentimentColor(alert.sentiment) }}
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 8, ease: 'linear' }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
