import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
    uploadTreePhoto,
    submitPlantedTree,
    getPlantedTreeCount,
    isSupabaseConfigured,
} from '../lib/supabase';
import { INDIA_CENTER } from '../data/referenceData';
import './PlantTree.css';

// Pin icon for mini-map location picker
const pinIcon = L.divIcon({
    className: 'plant-tree__map-pin',
    html: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#2D6A4F"/>
        <circle cx="16" cy="16" r="6" fill="#D8F3DC"/>
    </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
});

// Mini-map click handler
function LocationPicker({ position, onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? <Marker position={position} icon={pinIcon} /> : null;
}

// =============================================
// Steps config
// =============================================
const STEPS = [
    { key: 'info', label: 'Details', icon: '📋' },
    { key: 'photo', label: 'Photo', icon: '📸' },
    { key: 'location', label: 'Location', icon: '📍' },
    { key: 'review', label: 'Submit', icon: '✓' },
];

export default function PlantTree() {
    const [step, setStep] = useState(0);
    const [treeCount, setTreeCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Form state
    const [name, setName] = useState('');
    const [plantedDate, setPlantedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [location, setLocation] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Load tree count
    useEffect(() => {
        getPlantedTreeCount().then(setTreeCount);
    }, []);

    // Auto-detect GPS
    const detectGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setGpsLoading(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation([pos.coords.latitude, pos.coords.longitude]);
                setGpsLoading(false);
            },
            (err) => {
                setError('Could not detect location. Please select on the map.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Handle photo selection
    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Please upload a JPG, PNG, or WebP image');
            return;
        }
        // Validate file size (10MB raw, will be compressed before upload)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be under 10MB');
            return;
        }

        setPhotoFile(file);
        setError('');

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    }, []);

    // Handle drag & drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handlePhotoChange({ target: { files: [file] } });
        }
    }, [handlePhotoChange]);

    // Submit
    const handleSubmit = useCallback(async () => {
        if (!name.trim() || !photoFile || !location) return;
        if (!isSupabaseConfigured()) {
            setError('Supabase is not configured. Please check your .env file.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // 1. Upload compressed photo
            const photoUrl = await uploadTreePhoto(photoFile);

            // 2. Submit tree record + trigger AI verification
            await submitPlantedTree({
                planterName: name.trim(),
                plantedDate,
                photoUrl,
                latitude: location[0],
                longitude: location[1],
            });

            setSubmitted(true);
            setTreeCount((c) => c + 1);
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [name, photoFile, location, plantedDate]);

    // Step validation
    const canProceed = () => {
        switch (step) {
            case 0: return name.trim().length >= 2;
            case 1: return !!photoFile;
            case 2: return !!location;
            default: return true;
        }
    };

    // Reset form
    const resetForm = () => {
        setStep(0);
        setName('');
        setPlantedDate(new Date().toISOString().split('T')[0]);
        setPhotoFile(null);
        setPhotoPreview('');
        setLocation(null);
        setSubmitted(false);
        setError('');
    };

    // =============================================
    // Success screen
    // =============================================
    if (submitted) {
        return (
            <div className="plant-tree">
                <motion.div
                    className="plant-tree__success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="plant-tree__success-icon">🌱</div>
                    <h2>Tree Submitted for Verification</h2>
                    <p>
                        Our AI is analyzing your photo. Once verified, your tree will appear
                        on the map as a 🌳 marker — visible to everyone, forever.
                    </p>
                    <div className="plant-tree__success-stats">
                        <div className="plant-tree__stat">
                            <span className="plant-tree__stat-number">{treeCount}</span>
                            <span className="plant-tree__stat-label">Trees Planted by Community</span>
                        </div>
                    </div>
                    <button className="plant-tree__btn plant-tree__btn--primary" onClick={resetForm}>
                        Plant Another Tree
                    </button>
                </motion.div>
            </div>
        );
    }

    // Safety check for map center
    const mapCenter = location || INDIA_CENTER || [20.5937, 78.9629];

    console.log('PlantTree rendering, step:', step);

    return (
        <div className="plant-tree">
            {/* ... rest of the component ... */}
            {/* Hero */}
            <div className="plant-tree__hero">
                <div className="plant-tree__hero-content">
                    <h1 className="plant-tree__title">
                        <span className="plant-tree__title-icon">🌱</span>
                        Plant a Tree
                    </h1>
                    <p className="plant-tree__subtitle">
                        Plant a real tree, share the proof, and watch it appear on our map forever.
                        Every tree you plant makes India greener — one pin at a time.
                    </p>
                    <div className="plant-tree__counter">
                        <span className="plant-tree__counter-num">{treeCount}</span>
                        <span className="plant-tree__counter-label">trees planted by our community</span>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="plant-tree__stepper">
                {STEPS.map((s, i) => (
                    <div
                        key={s.key}
                        className={`plant-tree__step-indicator ${i === step ? 'plant-tree__step-indicator--active' : ''} ${i < step ? 'plant-tree__step-indicator--done' : ''}`}
                    >
                        <span className="plant-tree__step-num">
                            {i < step ? '✓' : s.icon}
                        </span>
                        <span className="plant-tree__step-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Form card */}
            <div className="plant-tree__card">
                <AnimatePresence mode="wait">
                    {/* Step 0: Name & Date */}
                    {step === 0 && (
                        <motion.div
                            key="info"
                            className="plant-tree__form-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="plant-tree__step-title">Your Details</h2>
                            <p className="plant-tree__step-desc">
                                Your name is used only for verification — it won't be displayed publicly.
                            </p>
                            <div className="plant-tree__field">
                                <label htmlFor="planter-name">Your Name</label>
                                <input
                                    id="planter-name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>
                            <div className="plant-tree__field">
                                <label htmlFor="planted-date">Date Planted</label>
                                <input
                                    id="planted-date"
                                    type="date"
                                    value={plantedDate}
                                    onChange={(e) => setPlantedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 1: Photo Upload */}
                    {step === 1 && (
                        <motion.div
                            key="photo"
                            className="plant-tree__form-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="plant-tree__step-title">Upload Photo</h2>
                            <p className="plant-tree__step-desc">
                                Take a clear photo of your planted tree or sapling in the ground.
                                AI will verify it's a real planting.
                            </p>
                            <div
                                className={`plant-tree__dropzone ${photoPreview ? 'plant-tree__dropzone--has-photo' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Tree preview" className="plant-tree__preview" />
                                ) : (
                                    <div className="plant-tree__dropzone-content">
                                        <span className="plant-tree__dropzone-icon">📸</span>
                                        <span>Click or drag a photo here</span>
                                        <span className="plant-tree__dropzone-hint">JPG, PNG, or WebP · Max 10MB</span>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    capture="environment"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            {photoFile && (
                                <button
                                    className="plant-tree__change-photo"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhotoFile(null);
                                        setPhotoPreview('');
                                    }}
                                >
                                    Remove photo
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Location */}
                    {step === 2 && (
                        <motion.div
                            key="location"
                            className="plant-tree__form-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="plant-tree__step-title">Tree Location</h2>
                            <p className="plant-tree__step-desc">
                                Auto-detect your GPS position or tap on the map to set where you planted the tree.
                            </p>
                            <button
                                className="plant-tree__btn plant-tree__btn--gps"
                                onClick={detectGPS}
                                disabled={gpsLoading}
                            >
                                {gpsLoading ? (
                                    <span className="plant-tree__spinner" />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
                                )}
                                {gpsLoading ? 'Detecting...' : 'Use My Location'}
                            </button>
                            {location && (
                                <div className="plant-tree__coords">
                                    {location[0].toFixed(5)}, {location[1].toFixed(5)}
                                </div>
                            )}
                            <div className="plant-tree__minimap">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={location ? 14 : 5}
                                    scrollWheelZoom={true}
                                    className="plant-tree__minimap-container"
                                    zoomControl={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    />
                                    <LocationPicker
                                        position={location}
                                        onLocationSelect={setLocation}
                                    />
                                </MapContainer>
                                <span className="plant-tree__minimap-hint">
                                    Tap on the map to select location
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <motion.div
                            key="review"
                            className="plant-tree__form-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="plant-tree__step-title">Review & Submit</h2>
                            <div className="plant-tree__review">
                                <div className="plant-tree__review-row">
                                    <span className="plant-tree__review-label">Date</span>
                                    <span>{plantedDate}</span>
                                </div>
                                <div className="plant-tree__review-row">
                                    <span className="plant-tree__review-label">Location</span>
                                    <span>{location ? `${location[0].toFixed(4)}, ${location[1].toFixed(4)}` : '—'}</span>
                                </div>
                                {photoPreview && (
                                    <img src={photoPreview} alt="Tree" className="plant-tree__review-photo" />
                                )}
                            </div>
                            <p className="plant-tree__step-desc">
                                Once submitted, AI will verify your photo. Verified trees appear on the map
                                as 🌳 markers that stay forever.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                {error && <div className="plant-tree__error">{error}</div>}

                {/* Navigation */}
                <div className="plant-tree__nav">
                    {step > 0 && (
                        <button
                            className="plant-tree__btn plant-tree__btn--secondary"
                            onClick={() => setStep(step - 1)}
                            disabled={submitting}
                        >
                            Back
                        </button>
                    )}
                    <div className="plant-tree__nav-spacer" />
                    {step < 3 ? (
                        <button
                            className="plant-tree__btn plant-tree__btn--primary"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            className="plant-tree__btn plant-tree__btn--primary plant-tree__btn--submit"
                            onClick={handleSubmit}
                            disabled={submitting || !canProceed()}
                        >
                            {submitting ? (
                                <>
                                    <span className="plant-tree__spinner" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit My Tree 🌱'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
