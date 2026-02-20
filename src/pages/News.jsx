import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNews } from '../hooks/useNews';
import { getCategoryColor, getCategoryLabel, formatTimeAgo } from '../data/referenceData';
import './News.css';

const CATEGORIES = [
    { value: '', label: 'All' },
    { value: 'deforestation', label: 'Deforestation' },
    { value: 'fire', label: 'Fire' },
    { value: 'conservation', label: 'Conservation' },
    { value: 'wildlife', label: 'Wildlife' },
    { value: 'policy', label: 'Policy' },
];

const SENTIMENTS = [
    { value: '', label: 'All' },
    { value: 'positive', label: 'Positive' },
    { value: 'negative', label: 'Negative' },
    { value: 'neutral', label: 'Neutral' },
];

export default function News() {
    const [category, setCategory] = useState('');
    const [sentiment, setSentiment] = useState('');
    const { news, loading } = useNews({ category: category || undefined, sentiment: sentiment || undefined });

    return (
        <div className="news-page">
            <motion.div
                className="news-page__header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="news-page__title">Forest News</h1>
                <p className="news-page__subtitle">
                    Latest verified news about India's forests, environmental incidents, and conservation efforts
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                className="news-page__filters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <div className="news-page__filter-group">
                    <span className="news-page__filter-label">Category</span>
                    <div className="news-page__filter-pills">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                className={`news-page__pill ${category === cat.value ? 'news-page__pill--active' : ''}`}
                                onClick={() => setCategory(cat.value)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="news-page__filter-group">
                    <span className="news-page__filter-label">Sentiment</span>
                    <div className="news-page__filter-pills">
                        {SENTIMENTS.map(s => (
                            <button
                                key={s.value}
                                className={`news-page__pill ${sentiment === s.value ? 'news-page__pill--active' : ''}`}
                                onClick={() => setSentiment(s.value)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* News Grid */}
            {loading ? (
                <div className="news-page__loading">Loading news articles...</div>
            ) : (
                <div className="news-page__grid">
                    <AnimatePresence>
                        {news.map((article, i) => (
                            <motion.a
                                key={article.id}
                                className="news-card solid-card"
                                href={article.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                layout
                                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            >
                                <div className="news-card__top">
                                    <span
                                        className="news-card__category"
                                        style={{ color: getCategoryColor(article.category), background: getCategoryColor(article.category) + '12' }}
                                    >
                                        {getCategoryLabel(article.category)}
                                    </span>
                                    <span className={`news-card__sentiment news-card__sentiment--${article.sentiment}`}>
                                        {article.sentiment}
                                    </span>
                                </div>
                                <h3 className="news-card__title">{article.title}</h3>
                                <p className="news-card__desc">{article.description}</p>
                                <div className="news-card__footer">
                                    <div className="news-card__meta">
                                        <span className="news-card__source">{article.source_name}</span>
                                        <span className="news-card__time">{formatTimeAgo(article.published_at)}</span>
                                    </div>
                                    <div className="news-card__location">
                                        {article.state}
                                    </div>
                                </div>
                                <div className="news-card__read-more">
                                    Read full article
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </div>
                            </motion.a>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {news.length === 0 && !loading && (
                <div className="news-page__empty">
                    <h3>No articles found</h3>
                    <p>News articles will appear after the Edge Function fetches from NewsData.io. Invoke the function or wait for the scheduled run.</p>
                </div>
            )}
        </div>
    );
}
