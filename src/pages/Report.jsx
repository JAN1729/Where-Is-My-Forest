import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { fetchIncidents, submitIncident } from '../lib/dataService';
import { formatTimeAgo } from '../data/referenceData';
import './Report.css';

const CATEGORIES = [
    { value: 'illegal_logging', label: 'Illegal Logging' },
    { value: 'encroachment', label: 'Encroachment' },
    { value: 'poaching', label: 'Poaching' },
    { value: 'mining', label: 'Illegal Mining' },
    { value: 'pollution', label: 'Pollution' },
    { value: 'land_grab', label: 'Land Grab' },
    { value: 'other', label: 'Other' },
];

const SEVERITY = [
    { value: 'critical', label: 'Critical', desc: 'Immediate threat to protected area or species' },
    { value: 'high', label: 'High', desc: 'Significant ongoing damage' },
    { value: 'medium', label: 'Medium', desc: 'Moderate impact, needs attention' },
    { value: 'low', label: 'Low', desc: 'Minor concern, early warning' },
];

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Ladakh', 'Jammu & Kashmir',
];

const STATUS_LABELS = {
    reported: 'Reported',
    verified: 'Verified',
    investigating: 'Under Investigation',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
};

// ── Map click handler ─────────────────────────
function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function Report() {
    const [step, setStep] = useState(0); // 0=list, 1=form
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [filterState, setFilterState] = useState('');
    const [formStep, setFormStep] = useState(0);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', category: '', severity: 'medium',
        latitude: null, longitude: null, state: '', district: '',
        location_name: '', reporter_name: '', reporter_org: '', reporter_contact: '',
    });

    const showSection = (index) => !isMobile || formStep === index;
    const canProceedToDetails = form.latitude !== null && form.longitude !== null && form.state !== '';
    const canProceedToInfo = form.title !== '' && form.category !== '' && form.severity !== '';

    // Load existing incidents
    const loadIncidents = useCallback(async () => {
        setLoading(true);
        const { data } = await fetchIncidents(filterState ? { state: filterState } : {});
        if (data) setIncidents(data);
        setLoading(false);
    }, [filterState]);

    useEffect(() => { loadIncidents(); }, [loadIncidents]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.category || !form.latitude) return;

        setSubmitting(true);
        const { data, error } = await submitIncident(form);
        setSubmitting(false);

        if (!error && data) {
            setSubmitted(true);
            setForm({
                title: '', description: '', category: '', severity: 'medium',
                latitude: null, longitude: null, state: '', district: '',
                location_name: '', reporter_name: '', reporter_org: '', reporter_contact: '',
            });
            setTimeout(() => {
                setSubmitted(false);
                setStep(0);
                loadIncidents();
            }, 2000);
        }
    };

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="report-page">
            {/* Header */}
            <motion.div className="report-page__header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="report-page__title">Incident Reporting</h1>
                <p className="report-page__subtitle">
                    Report environmental violations, encroachment, or threats to forest areas.
                    All reports are geo-tagged and tracked through resolution.
                </p>
                <div className="report-page__actions">
                    <button
                        className={`report-page__tab ${step === 0 ? 'report-page__tab--active' : ''}`}
                        onClick={() => setStep(0)}
                    >
                        Recent Reports ({incidents.length})
                    </button>
                    <button
                        className={`report-page__tab ${step === 1 ? 'report-page__tab--active' : ''}`}
                        onClick={() => setStep(1)}
                    >
                        Submit New Report
                    </button>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {step === 0 ? (
                    /* ── Incidents List ────────────────────────── */
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="report-page__filters">
                            <div className="report-page__state-chips">
                                <button
                                    className={`report-page__chip ${filterState === '' ? 'report-page__chip--active' : ''}`}
                                    onClick={() => setFilterState('')}
                                >
                                    All States
                                </button>
                                {STATES.map(s => (
                                    <button
                                        key={s}
                                        className={`report-page__chip ${filterState === s ? 'report-page__chip--active' : ''}`}
                                        onClick={() => setFilterState(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="report-page__loading">Loading reports...</div>
                        ) : incidents.length === 0 ? (
                            <div className="report-page__empty solid-card">
                                <h3>No incidents reported yet</h3>
                                <p>Be the first to submit a field report. Click "Submit New Report" above to document an environmental violation or threat.</p>
                            </div>
                        ) : (
                            <div className="report-page__list">
                                {incidents.map(inc => (
                                    <div key={inc.id} className="incident-card solid-card">
                                        <div className="incident-card__header">
                                            <span className={`incident-card__severity incident-card__severity--${inc.severity}`}>
                                                {inc.severity}
                                            </span>
                                            <span className="incident-card__category">{CATEGORIES.find(c => c.value === inc.category)?.label || inc.category}</span>
                                            <span className={`incident-card__status incident-card__status--${inc.status}`}>
                                                {STATUS_LABELS[inc.status] || inc.status}
                                            </span>
                                        </div>
                                        <h3 className="incident-card__title">{inc.title}</h3>
                                        {inc.description && <p className="incident-card__desc">{inc.description}</p>}
                                        <div className="incident-card__meta">
                                            <span>{inc.location_name || inc.district || inc.state || 'Unknown location'}</span>
                                            <span>{formatTimeAgo(inc.reported_at)}</span>
                                            {inc.reporter_org && <span>{inc.reporter_org}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* ── Submission Form ───────────────────────── */
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {submitted ? (
                            <div className="report-page__success solid-card">
                                <h3>Report Submitted Successfully</h3>
                                <p>Your incident report has been recorded and will be reviewed. You will be redirected to the reports list.</p>
                            </div>
                        ) : (
                            <form className="report-form" onSubmit={handleSubmit}>
                                {/* Mobile Wizard Progress */}
                                {isMobile && (
                                    <div className="report-form__wizard-progress">
                                        <div className={`report-form__wizard-step ${formStep >= 0 ? 'report-form__wizard-step--active' : ''}`}>1. Location</div>
                                        <div className={`report-form__wizard-step ${formStep >= 1 ? 'report-form__wizard-step--active' : ''}`}>2. Details</div>
                                        <div className={`report-form__wizard-step ${formStep >= 2 ? 'report-form__wizard-step--active' : ''}`}>3. Reporter</div>
                                    </div>
                                )}

                                {/* Location Map */}
                                {showSection(0) && (
                                    <div className="report-form__section solid-card">
                                        <h3 className="report-form__section-title">1. Location</h3>
                                        <p className="report-form__section-desc">Click on the map to set incident coordinates, or enter them manually.</p>
                                        <div className="report-form__map-wrapper">
                                            <MapContainer center={[22.5, 79.0]} zoom={5} style={{ height: '300px', minHeight: '250px', width: '100%', borderRadius: '8px' }}>
                                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                                <LocationPicker onLocationSelect={({ lat, lng }) => {
                                                    setField('latitude', parseFloat(lat.toFixed(4)));
                                                    setField('longitude', parseFloat(lng.toFixed(4)));
                                                }} />
                                                {form.latitude && form.longitude && (
                                                    <Marker position={[form.latitude, form.longitude]} />
                                                )}
                                            </MapContainer>
                                        </div>
                                        <div className="report-form__row">
                                            <div className="report-form__field">
                                                <label>Latitude</label>
                                                <input type="number" step="0.0001" value={form.latitude || ''} onChange={e => setField('latitude', parseFloat(e.target.value))} placeholder="e.g. 22.5437" required />
                                            </div>
                                            <div className="report-form__field">
                                                <label>Longitude</label>
                                                <input type="number" step="0.0001" value={form.longitude || ''} onChange={e => setField('longitude', parseFloat(e.target.value))} placeholder="e.g. 79.0882" required />
                                            </div>
                                            <div className="report-form__field">
                                                <label>State</label>
                                                <select value={form.state} onChange={e => setField('state', e.target.value)}>
                                                    <option value="">Select state</option>
                                                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="report-form__row">
                                            <div className="report-form__field">
                                                <label>District</label>
                                                <input type="text" value={form.district} onChange={e => setField('district', e.target.value)} placeholder="District name" />
                                            </div>
                                            <div className="report-form__field report-form__field--wide">
                                                <label>Location Name</label>
                                                <input type="text" value={form.location_name} onChange={e => setField('location_name', e.target.value)} placeholder="e.g. Near Bandhavgarh Gate 3" />
                                            </div>
                                        </div>
                                        {isMobile && (
                                            <button type="button" className="report-form__nav-btn" onClick={() => setFormStep(1)} disabled={!canProceedToDetails}>
                                                Next: Details →
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Incident Details */}
                                {showSection(1) && (
                                    <div className="report-form__section solid-card">
                                        <h3 className="report-form__section-title">2. Incident Details</h3>
                                        <div className="report-form__field">
                                            <label>Title *</label>
                                            <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Brief title describing the incident" required />
                                        </div>
                                        <div className="report-form__field">
                                            <label>Category *</label>
                                            <div className="report-form__category-grid">
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        className={`report-form__category-btn ${form.category === cat.value ? 'report-form__category-btn--active' : ''}`}
                                                        onClick={() => setField('category', cat.value)}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="report-form__field">
                                            <label>Severity *</label>
                                            <div className="report-form__severity-grid">
                                                {SEVERITY.map(sev => (
                                                    <button
                                                        key={sev.value}
                                                        type="button"
                                                        className={`report-form__severity-btn report-form__severity-btn--${sev.value} ${form.severity === sev.value ? 'report-form__severity-btn--active' : ''}`}
                                                        onClick={() => setField('severity', sev.value)}
                                                    >
                                                        <strong>{sev.label}</strong>
                                                        <span>{sev.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="report-form__field">
                                            <label>Description</label>
                                            <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Detailed description of the incident, observations, evidence seen..." rows={4} />
                                        </div>
                                        {isMobile && (
                                            <div className="report-form__nav-row">
                                                <button type="button" className="report-form__nav-btn report-form__nav-btn--back" onClick={() => setFormStep(0)}>
                                                    ← Back
                                                </button>
                                                <button type="button" className="report-form__nav-btn" onClick={() => setFormStep(2)} disabled={!canProceedToInfo}>
                                                    Next: Reporter →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reporter Info */}
                                {showSection(2) && (
                                    <div className="report-form__section solid-card">
                                        <h3 className="report-form__section-title">3. Reporter Information (Optional)</h3>
                                        <p className="report-form__section-desc">Your contact details help us follow up. Anonymous reports are also accepted.</p>
                                        <div className="report-form__row">
                                            <div className="report-form__field">
                                                <label>Name</label>
                                                <input type="text" value={form.reporter_name} onChange={e => setField('reporter_name', e.target.value)} placeholder="Your name" />
                                            </div>
                                            <div className="report-form__field">
                                                <label>Organisation</label>
                                                <input type="text" value={form.reporter_org} onChange={e => setField('reporter_org', e.target.value)} placeholder="NGO or organisation" />
                                            </div>
                                            <div className="report-form__field">
                                                <label>Contact</label>
                                                <input type="text" value={form.reporter_contact} onChange={e => setField('reporter_contact', e.target.value)} placeholder="Phone or email" />
                                            </div>
                                        </div>
                                        {isMobile && (
                                            <div className="report-form__nav-row">
                                                <button type="button" className="report-form__nav-btn report-form__nav-btn--back" onClick={() => setFormStep(1)}>
                                                    ← Back
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {showSection(2) && (
                                    <button type="submit" className="report-form__submit" disabled={submitting || !form.title || !form.category || !form.latitude}>
                                        {submitting ? 'Submitting...' : 'Submit Incident Report'}
                                    </button>
                                )}
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
