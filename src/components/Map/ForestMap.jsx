import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    INDIA_CENTER, INDIA_ZOOM, INDIA_OUTLINE, FOREST_DOTS,
    FOREST_REGION_LABELS, formatTimeAgo,
} from '../../data/referenceData';
import './ForestMap.css';

// Fly-to animation
function FlyToHandler({ position }) {
    const map = useMap();
    if (position) {
        map.flyTo(position, 8, { duration: 1.5 });
    }
    return null;
}

// Locate User Control
function LocateControl() {
    const map = useMap();
    const handleLocate = () => {
        map.locate().on("locationfound", (e) => {
            map.flyTo(e.latlng, 12, { duration: 1.5 });
            L.circleMarker(e.latlng, { radius: 6, fillColor: '#3A86FF', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map);
        });
    };
    return (
        <button className="forest-map__locate-btn" onClick={handleLocate} title="Locate Me">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            </svg>
        </button>
    );
}

// Color by sentiment
function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'negative': return '#C1121F';
        case 'positive': return '#2D6A4F';
        default: return '#3A86FF';
    }
}

// Category short label
function getCategoryIcon(category) {
    switch (category) {
        case 'deforestation': return 'DEF';
        case 'fire': return 'FIR';
        case 'wildlife': return 'WLD';
        case 'conservation': return 'CON';
        case 'pollution': return 'POL';
        case 'policy': return 'GOV';
        default: return 'NWS';
    }
}

// Invisible icon for region labels (we only want the tooltip)
const invisibleIcon = L.divIcon({
    className: 'forest-map__label-icon',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
});

// Tree emoji icon for community planted trees
const treeEmojiIcon = L.divIcon({
    className: 'forest-map__tree-emoji',
    html: '<span class="forest-map__tree-icon">🌳</span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

export default function ForestMap({ news = [], plantedTrees = [], flyToPosition, onNewsClick }) {
    const geoNews = useMemo(() => news.filter(n => n.latitude && n.longitude), [news]);
    const [showForest, setShowForest] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showNews, setShowNews] = useState(true);
    const [showPlantedTrees, setShowPlantedTrees] = useState(true);
    const [controlsOpen, setControlsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // For mobile, slightly back out the zoom and adjust center to show full India
    const mapZoom = isMobile ? INDIA_ZOOM - 1 : INDIA_ZOOM;
    const mapCenter = isMobile ? [22.0, 78.0] : INDIA_CENTER;

    return (
        <div className="forest-map">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="forest-map__container"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* India boundary outline */}
                <GeoJSON
                    data={INDIA_OUTLINE}
                    style={{
                        color: '#1B4332',
                        weight: 2,
                        opacity: 0.5,
                        fillColor: '#D8F3DC',
                        fillOpacity: 0.06,
                    }}
                />

                {/* Dense forest cover shading — tiny dots, high count */}
                {showForest && FOREST_DOTS.map((dot, i) => (
                    <CircleMarker
                        key={`f-${i}`}
                        center={dot}
                        radius={1.4}
                        pathOptions={{
                            color: 'transparent',
                            fillColor: '#40916C',
                            fillOpacity: 0.5,
                        }}
                    />
                ))}

                {/* Forest region name labels */}
                {showLabels && FOREST_REGION_LABELS.map((region, i) => (
                    <Marker
                        key={`label-${i}`}
                        position={[region.lat, region.lng]}
                        icon={invisibleIcon}
                    >
                        <Tooltip
                            permanent
                            direction="center"
                            className="forest-map__region-tooltip"
                        >
                            {region.name}
                        </Tooltip>
                    </Marker>
                ))}

                {/* Community planted trees — cute tree emojis */}
                {showPlantedTrees && plantedTrees.map((tree) => (
                    <Marker
                        key={`tree-${tree.id}`}
                        position={[tree.latitude, tree.longitude]}
                        icon={treeEmojiIcon}
                    >
                        <Popup className="forest-map__popup">
                            <div className="forest-map__popup-inner">
                                <span className="forest-map__popup-type" style={{ color: '#2D6A4F' }}>
                                    🌱 Community Planted
                                </span>
                                <strong>{tree.tree_type || 'Tree'}</strong>
                                <span className="forest-map__popup-meta">
                                    Planted: {tree.planted_date}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* News location pins — color-coded by sentiment and sized by age */}
                {showNews && geoNews.map((article) => {
                    const ageInMs = new Date() - new Date(article.published_at);
                    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

                    let radius = 1.5; // Very old news (more than 3 days)
                    let opacity = 0.4;
                    let weight = 0.25;

                    if (ageInDays <= 1) {
                        radius = 4; // Today's news
                        opacity = 0.9;
                        weight = 1.5;
                    } else if (ageInDays <= 3) {
                        radius = 2.5; // Past few days
                        opacity = 0.6;
                        weight = 0.5;
                    }

                    return (
                        <CircleMarker
                            key={article.id}
                            center={[article.latitude, article.longitude]}
                            radius={radius}
                            pathOptions={{
                                color: '#fff',
                                weight: weight,
                                fillColor: getSentimentColor(article.sentiment),
                                fillOpacity: opacity,
                            }}
                            eventHandlers={{
                                click: () => onNewsClick?.(article),
                            }}
                        >
                            <Popup className="forest-map__popup">
                                <div className="forest-map__popup-inner">
                                    <span className="forest-map__popup-type" style={{ color: getSentimentColor(article.sentiment) }}>
                                        {getCategoryIcon(article.category)} {article.category}
                                    </span>
                                    <strong>{article.title}</strong>
                                    <span className="forest-map__popup-meta">
                                        {article.state || 'India'} · {article.source_name}
                                    </span>
                                    <span className="forest-map__popup-meta">
                                        {formatTimeAgo(article.published_at)}
                                    </span>
                                    {article.source_url && (
                                        <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                                            className="forest-map__popup-link">
                                            Read full article
                                        </a>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                <FlyToHandler position={flyToPosition} />
                <LocateControl />
            </MapContainer>

            {/* Layer Controls */}
            <div className={`forest-map__controls ${controlsOpen ? 'forest-map__controls--open' : ''}`}>
                <div className="forest-map__controls-header" onClick={() => setControlsOpen(!controlsOpen)}>
                    <span className="forest-map__controls-title">Layers</span>
                    <button className="forest-map__controls-toggle" aria-label="Toggle Layers">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d={controlsOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                        </svg>
                    </button>
                </div>
                <div className="forest-map__controls-body">
                    <label className="forest-map__control">
                        <input type="checkbox" checked={showForest} onChange={() => setShowForest(!showForest)} />
                        <span className="forest-map__control-dot" style={{ background: '#40916C' }}></span>
                        Forest Cover
                    </label>
                    <label className="forest-map__control">
                        <input type="checkbox" checked={showLabels} onChange={() => setShowLabels(!showLabels)} />
                        <span className="forest-map__control-dot" style={{ background: '#1B4332' }}></span>
                        Region Labels
                    </label>
                    <label className="forest-map__control">
                        <input type="checkbox" checked={showPlantedTrees} onChange={() => setShowPlantedTrees(!showPlantedTrees)} />
                        <span className="forest-map__control-dot forest-map__control-dot--tree">🌳</span>
                        Community Trees
                    </label>
                    <label className="forest-map__control">
                        <input type="checkbox" checked={showNews} onChange={() => setShowNews(!showNews)} />
                        <span className="forest-map__control-dot" style={{ background: '#C1121F' }}></span>
                        News Markers
                    </label>
                </div>
            </div>

            {/* Legend */}
            <div className="forest-map__legend">
                <span className="forest-map__legend-title">Legend</span>
                <div className="forest-map__legend-item">
                    <span className="forest-map__legend-dot" style={{ background: '#40916C' }}></span>
                    Forest Cover (ISFR 2023)
                </div>
                <div className="forest-map__legend-item">
                    <span className="forest-map__legend-emoji">🌳</span>
                    Community Planted
                </div>
                <div className="forest-map__legend-item">
                    <span className="forest-map__legend-dot" style={{ background: '#C1121F' }}></span>
                    Alert / Negative
                </div>
                <div className="forest-map__legend-item">
                    <span className="forest-map__legend-dot" style={{ background: '#2D6A4F' }}></span>
                    Positive
                </div>
                <div className="forest-map__legend-item">
                    <span className="forest-map__legend-dot" style={{ background: '#3A86FF' }}></span>
                    Other
                </div>
            </div>
        </div>
    );
}
