import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './StatsCards.css';

function AnimatedNumber({ value, duration = 1200 }) {
    const [display, setDisplay] = useState(0);
    const frameRef = useRef(null);

    useEffect(() => {
        if (!value) { setDisplay(0); return; }
        const start = performance.now();
        const from = 0;
        const to = value;

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplay(Math.round(from + (to - from) * eased));
            if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        }
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);

    return <>{display.toLocaleString('en-IN')}</>;
}

const CARD_DEFS = [
    { key: 'totalForestCover', label: 'Total Forest Cover', unit: 'km²', accent: 'var(--forest)' },
    { key: 'totalAlerts', label: 'Active Alerts', unit: '', accent: 'var(--alert-red)' },
    { key: 'statesAffected', label: 'States Affected', unit: '', accent: 'var(--fire-orange)' },
    { key: 'decreasingStates', label: 'Declining States', unit: '', accent: 'var(--alert-red)' },
];

export default function StatsCards({ summary }) {
    return (
        <div className="stats-cards">
            {CARD_DEFS.map((def, i) => (
                <motion.div
                    className="stats-card solid-card"
                    key={def.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    style={{ '--card-accent': def.accent }}
                >
                    <div className="stats-card__accent-bar"></div>
                    <span className="stats-card__label">{def.label}</span>
                    <span className="stats-card__value">
                        <AnimatedNumber value={summary[def.key]} />
                        {def.unit && <span className="stats-card__unit"> {def.unit}</span>}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
