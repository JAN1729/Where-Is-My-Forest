import { useState, useEffect, useRef } from 'react';
import { fetchNews } from '../lib/dataService';
import { subscribeToTable } from '../lib/supabase';

export function useNews(filters = {}) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unsubRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const { data, error: err } = await fetchNews(filters);
            if (!cancelled) {
                if (err) setError(err);
                else setNews(data || []);
                setLoading(false);
            }
        }
        load();

        // Realtime subscription for new articles
        const unsub = subscribeToTable('news_articles', (payload) => {
            if (payload.eventType === 'INSERT') {
                setNews(prev => [payload.new, ...prev].slice(0, 50));
            }
        });
        unsubRef.current = unsub;

        return () => {
            cancelled = true;
            if (unsubRef.current) unsubRef.current();
        };
    }, [filters.category, filters.sentiment, filters.state]);

    // Auto-refresh every 30 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            const { data } = await fetchNews(filters);
            if (data) setNews(data);
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [filters.category, filters.sentiment]);

    return { news, loading, error };
}
