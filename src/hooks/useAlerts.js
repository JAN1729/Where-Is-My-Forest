import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAlerts } from '../lib/dataService';
import { subscribeToTable } from '../lib/supabase';

export function useAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newAlertCount, setNewAlertCount] = useState(0);
    const [latestAlert, setLatestAlert] = useState(null);
    const unsubRef = useRef(null);

    // Initial fetch — alerts are now negative-sentiment news articles
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const { data, error: err } = await fetchAlerts(50);
            if (!cancelled) {
                if (err) setError(err);
                else setAlerts(data || []);
                setLoading(false);
            }
        }
        load();

        // Subscribe to new negative news articles
        const unsub = subscribeToTable('news_articles', (payload) => {
            if (payload.eventType === 'INSERT' && payload.new?.sentiment === 'negative') {
                setAlerts(prev => [payload.new, ...prev].slice(0, 50));
                setNewAlertCount(prev => prev + 1);
                setLatestAlert(payload.new);
            }
        });
        unsubRef.current = unsub;

        return () => {
            cancelled = true;
            if (unsubRef.current) unsubRef.current();
        };
    }, []);

    // Auto-refresh every 30 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            const { data } = await fetchAlerts(50);
            if (data) setAlerts(data);
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const clearNewAlertCount = useCallback(() => setNewAlertCount(0), []);
    const dismissLatestAlert = useCallback(() => setLatestAlert(null), []);

    return { alerts, loading, error, newAlertCount, latestAlert, clearNewAlertCount, dismissLatestAlert };
}
