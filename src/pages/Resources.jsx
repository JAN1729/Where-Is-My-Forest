import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fetchResourceDirectory, fetchProtectedAreas } from '../lib/dataService';
import { exportToCSV } from '../lib/exportUtils';
import './Resources.css';

const TABS = [
    { key: 'methodology', label: 'Methodology' },
    { key: 'legal', label: 'Legal Framework' },
    { key: 'protected', label: 'Protected Areas' },
    { key: 'directory', label: 'Directory' },
    { key: 'templates', label: 'Templates' },
    { key: 'funding', label: 'Funding' },
];

const LEGAL_ACTS = [
    {
        title: 'Indian Forest Act, 1927',
        year: '1927 (amended 2017)',
        scope: 'Defines reserved forests, protected forests, and village forests. Governs transit of timber and forest produce.',
        key_provisions: 'Section 26 — Acts prohibited in reserved forests. Section 33 — Protected forests provisions. Section 41A — Community forest management.',
        relevance: 'Foundation for all forest governance. Used for prosecuting encroachment and illegal logging.',
        link: 'https://legislative.gov.in/sites/default/files/A1927-16_0.pdf',
    },
    {
        title: 'Wildlife (Protection) Act, 1972',
        year: '1972 (amended 2022)',
        scope: 'Protects wild animals, birds, and plants. Establishes protected area network.',
        key_provisions: 'Schedule I — Highest protection. Section 38V — Community Reserves. Section 51 — Penalties for offences.',
        relevance: 'Legal basis for national parks, sanctuaries. Essential for anti-poaching cases.',
        link: 'https://legislative.gov.in/sites/default/files/A1972-53_1.pdf',
    },
    {
        title: 'Forest Conservation Act, 1980',
        year: '1980 (amended 2023)',
        scope: 'Restricts diversion of forest land for non-forest purposes without central approval.',
        key_provisions: 'Section 2 — Prior approval required for diversion. 2023 amendment — Exemptions for strategic/security projects within 100 km of borders.',
        relevance: 'Critical for challenging illegal diversion of forest land for mining, industry, or infrastructure.',
        link: 'https://legislative.gov.in/sites/default/files/A1980-69.pdf',
    },
    {
        title: 'Forest Rights Act, 2006',
        year: '2006',
        scope: 'Recognises rights of forest-dwelling communities over forest land and resources.',
        key_provisions: 'Section 3 — Individual and community forest rights. Section 5 — Community powers to protect forests. Gram Sabha authority for consent.',
        relevance: 'Essential for cases involving tribal displacement. FRA consent required before forest rights curtailed.',
        link: 'https://tribal.nic.in/fra.aspx',
    },
    {
        title: 'Environment Protection Act, 1986',
        year: '1986',
        scope: 'Umbrella legislation for environmental protection. Enables EIA notifications.',
        key_provisions: 'Section 3 — Power to take measures for environmental protection. Section 15 — Penalties. EIA Notification 2006 under this Act.',
        relevance: 'Used for pollution complaints, EIA challenges, and environmental clearance violations.',
        link: 'https://legislative.gov.in/sites/default/files/A1986-29_0.pdf',
    },
    {
        title: 'Biological Diversity Act, 2002',
        year: '2002 (amended 2023)',
        scope: 'Regulates access to biological resources and associated traditional knowledge.',
        key_provisions: 'National Biodiversity Authority. Biodiversity Management Committees at local level. Access and Benefit Sharing (ABS).',
        relevance: 'Relevant for biopiracy cases and protecting indigenous knowledge of forest communities.',
        link: 'https://legislative.gov.in/sites/default/files/A2003-18.pdf',
    },
    {
        title: 'National Green Tribunal Act, 2010',
        year: '2010',
        scope: 'Establishes NGT for effective disposal of environmental cases.',
        key_provisions: 'Section 14 — Jurisdiction for environmental disputes. Section 15 — Compensation and relief. 5 regional benches.',
        relevance: 'Primary judicial forum for filing environmental cases. Faster disposal than normal courts.',
        link: 'https://legislative.gov.in/sites/default/files/A2010-19.pdf',
    },
    {
        title: 'Compensatory Afforestation Fund Act, 2016',
        year: '2016',
        scope: 'Manages funds collected for compensatory afforestation due to forest diversion.',
        key_provisions: 'CAMPA funds for afforestation, forest management, wildlife protection. State-level CAMPA bodies.',
        relevance: 'Relevant for tracking compensatory afforestation compliance and fund utilization.',
        link: 'https://legislative.gov.in/sites/default/files/A2016-38_1.pdf',
    },
];

const FUNDING_SOURCES = [
    { name: 'CAMPA Fund', org: 'Ministry of Environment, Forest & Climate Change', desc: 'Compensatory afforestation funds for forest restoration and management activities.', url: 'https://campa.gov.in/' },
    { name: 'National Adaptation Fund', org: 'MoEFCC', desc: 'Climate change adaptation projects in vulnerable sectors including forests and biodiversity.', url: 'https://moef.gov.in/en/naf/' },
    { name: 'NABARD Watershed Development', org: 'NABARD', desc: 'Funding for afforestation, soil conservation, and integrated watershed management.', url: 'https://www.nabard.org/' },
    { name: 'GEF Small Grants Programme', org: 'UNDP/GEF', desc: 'Grants up to $50,000 for community-based environmental projects.', url: 'https://sgp.undp.org/' },
    { name: 'Critical Ecosystem Partnership Fund', org: 'CEPF', desc: 'Grants for civil society conservation in biodiversity hotspots (Western Ghats, Himalaya).', url: 'https://www.cepf.net/' },
    { name: 'WWF India Grants', org: 'WWF', desc: 'Wildlife and habitat conservation funding across priority landscapes.', url: 'https://www.wwfindia.org/' },
    { name: 'Ford Foundation', org: 'Ford Foundation', desc: 'Grants supporting environmental justice, indigenous rights, and land governance.', url: 'https://www.fordfoundation.org/' },
    { name: 'Rohini Nilekani Philanthropies', org: 'RNP', desc: 'Ecology and environment grants focused on Indian conservation priorities.', url: 'https://rohininilekani.org/' },
    { name: 'Azim Premji Foundation', org: 'Azim Premji', desc: 'Ecology and environment programme supporting grassroots conservation efforts.', url: 'https://azimpremjiphilanthropicinitiatives.org/' },
];

export default function Resources() {
    const [activeTab, setActiveTab] = useState('methodology');
    const [protectedAreas, setProtectedAreas] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [paFilters, setPAFilters] = useState({ state: '', type: '' });
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [expandedLegalActs, setExpandedLegalActs] = useState([]);
    const [expandedTemplates, setExpandedTemplates] = useState([]);
    const [copiedContent, setCopiedContent] = useState(null);

    const toggleLegalAct = (index) => {
        setExpandedLegalActs(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    const toggleTemplate = (index) => {
        setExpandedTemplates(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedContent(id);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    useEffect(() => {
        fetchProtectedAreas().then(({ data }) => data && setProtectedAreas(data));
        fetchResourceDirectory().then(({ data }) => data && setDirectory(data));
    }, []);

    const filteredAreas = useMemo(() => {
        let areas = protectedAreas;
        if (paFilters.state) areas = areas.filter(a => a.state === paFilters.state);
        if (paFilters.type) areas = areas.filter(a => a.type === paFilters.type);
        return areas;
    }, [protectedAreas, paFilters]);

    const paStates = useMemo(() => [...new Set(protectedAreas.map(a => a.state))].sort(), [protectedAreas]);
    const typeLabels = { national_park: 'National Park', wildlife_sanctuary: 'Wildlife Sanctuary', tiger_reserve: 'Tiger Reserve', biosphere_reserve: 'Biosphere Reserve', community_reserve: 'Community Reserve', conservation_reserve: 'Conservation Reserve' };

    return (
        <div className="resources-page">
            <motion.div className="resources-page__header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="resources-page__title">Resources</h1>
                <p className="resources-page__subtitle">
                    Data methodology, legal frameworks, protected area directory, templates for action, and funding pathways for conservation organisations in India.
                </p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="resources-page__tabs">
                {TABS.map(tab => (
                    <button key={tab.key} className={`resources-page__tab ${activeTab === tab.key ? 'resources-page__tab--active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="resources-page__content">
                {activeTab === 'methodology' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <h2>Data Sources and Methodology</h2>
                            <p>This platform integrates multiple authoritative data sources to provide a comprehensive picture of India's forest conservation landscape. All data is updated periodically and cross-referenced for accuracy.</p>
                        </div>

                        <div className="resources-tab__grid">
                            <div className="solid-card">
                                <h3>Global Forest Watch (GFW)</h3>
                                <p className="resources-tab__source-type">Primary satellite data</p>
                                <p>Tree cover loss and gain data derived from Landsat satellite imagery at 30m resolution. Processed by the University of Maryland and World Resources Institute.</p>
                                <ul className="resources-tab__details">
                                    <li>Annual forest cover loss (2001 onward)</li>
                                    <li>CO2 emissions from deforestation</li>
                                    <li>Regional tree cover distribution by canopy density</li>
                                </ul>
                                <p className="resources-tab__citation">Hansen et al. (2013), High-Resolution Global Maps of 21st-Century Forest Cover Change. Science, 342(6160).</p>
                            </div>

                            <div className="solid-card">
                                <h3>India State of Forest Report (ISFR)</h3>
                                <p className="resources-tab__source-type">Government survey data</p>
                                <p>Biennial assessment by the Forest Survey of India using satellite imagery. Provides state-wise forest cover classification (Very Dense, Moderately Dense, Open, Scrub).</p>
                                <ul className="resources-tab__details">
                                    <li>State-level forest cover area (km2)</li>
                                    <li>Percentage of geographical area under forest</li>
                                    <li>Year-on-year change assessment</li>
                                </ul>
                                <p className="resources-tab__citation">Forest Survey of India, ISFR 2023. Ministry of Environment, Forest & Climate Change.</p>
                            </div>

                            <div className="solid-card">
                                <h3>Protected Area Network</h3>
                                <p className="resources-tab__source-type">Official registry data</p>
                                <p>National parks, wildlife sanctuaries, tiger reserves, and biosphere reserves from the Wildlife Institute of India and the National Wildlife Database.</p>
                                <ul className="resources-tab__details">
                                    <li>Location coordinates and area coverage</li>
                                    <li>Establishment year and designation type</li>
                                    <li>Notable species and threat assessments</li>
                                </ul>
                                <p className="resources-tab__citation">Wildlife Institute of India, ENVIS Centre for Wildlife and Protected Areas.</p>
                            </div>

                            <div className="solid-card">
                                <h3>Media Monitoring</h3>
                                <p className="resources-tab__source-type">Aggregated news intelligence</p>
                                <p>Automated collection and classification of forest-related news from major Indian media sources. Categorised by topic, sentiment, and geography using NLP analysis.</p>
                                <ul className="resources-tab__details">
                                    <li>Sentiment analysis (positive/negative/neutral)</li>
                                    <li>Category classification (policy, wildlife, fire, etc.)</li>
                                    <li>State and region attribution</li>
                                </ul>
                                <p className="resources-tab__citation">Sources include The Hindu, Down to Earth, Mongabay India, NDTV, Press Trust of India.</p>
                            </div>
                        </div>

                        <div className="solid-card">
                            <h3>Update Frequency</h3>
                            <table className="resources-tab__table">
                                <thead>
                                    <tr><th>Data Source</th><th>Update Cycle</th><th>Coverage</th><th>Resolution</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>GFW Tree Cover Loss</td><td>Annual (calendar year)</td><td>2001 — present</td><td>30m Landsat</td></tr>
                                    <tr><td>ISFR Forest Cover</td><td>Biennial</td><td>All 28 states + 8 UTs</td><td>State-level</td></tr>
                                    <tr><td>Protected Areas</td><td>Updated on designation changes</td><td>All of India</td><td>Site-level</td></tr>
                                    <tr><td>News Monitoring</td><td>Every 6 hours</td><td>Major Indian media</td><td>Article-level</td></tr>
                                    <tr><td>Incident Reports</td><td>Real-time (user submitted)</td><td>All of India</td><td>GPS coordinates</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'legal' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <h2>Legal Framework for Conservation</h2>
                            <p>Key legislation governing forest conservation, wildlife protection, and environmental governance in India. Understanding these acts is essential for effective advocacy and legal action.</p>
                        </div>
                        <div className="legal-grid">
                            {LEGAL_ACTS.map((act, i) => {
                                const isExpanded = expandedLegalActs.includes(i);
                                return (
                                    <div key={i} className={`legal-card solid-card ${isExpanded ? 'legal-card--expanded' : ''}`}>
                                        <div
                                            className="legal-card__header"
                                            onClick={() => toggleLegalAct(i)}
                                            style={{ cursor: 'pointer', marginBottom: isExpanded ? 'var(--sp-12)' : '0' }}
                                        >
                                            <div className="legal-card__title-row">
                                                <h3>{act.title}</h3>
                                                <span className="legal-card__year">{act.year}</span>
                                            </div>
                                            <button className="legal-card__toggle-btn" aria-label="Toggle details">
                                                {isExpanded ? '−' : '+'}
                                            </button>
                                        </div>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="legal-card__content"
                                            >
                                                <p className="legal-card__scope">{act.scope}</p>
                                                <div className="legal-card__section">
                                                    <strong>Key Provisions</strong>
                                                    <p>{act.key_provisions}</p>
                                                </div>
                                                <div className="legal-card__section">
                                                    <strong>Relevance for NGOs</strong>
                                                    <p>{act.relevance}</p>
                                                </div>
                                                <a href={act.link} target="_blank" rel="noopener noreferrer" className="legal-card__link">
                                                    Full text (legislative.gov.in)
                                                </a>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'protected' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <div className="resources-tab__intro-row">
                                <div>
                                    <h2>Protected Areas of India</h2>
                                    <p>National parks, wildlife sanctuaries, tiger reserves, and biosphere reserves. {protectedAreas.length} areas catalogued with coordinates, species, and threat assessments.</p>
                                </div>
                                <button className="resources-tab__export-btn" onClick={() => exportToCSV(filteredAreas, 'protected_areas_india')}>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="resources-tab__filters-container">
                            <div className="resources-tab__filters-header" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                                <span>Filter Protected Areas</span>
                                <button className="resources-tab__filters-toggle">
                                    {showMobileFilters ? 'Hide' : 'Show'} Filters
                                </button>
                            </div>
                            <div className={`resources-tab__filters ${showMobileFilters ? 'resources-tab__filters--show' : ''}`}>
                                <select value={paFilters.state} onChange={e => setPAFilters(p => ({ ...p, state: e.target.value }))}>
                                    <option value="">All States ({protectedAreas.length})</option>
                                    {paStates.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={paFilters.type} onChange={e => setPAFilters(p => ({ ...p, type: e.target.value }))}>
                                    <option value="">All Types</option>
                                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <span className="resources-tab__result-count">{filteredAreas.length} results</span>
                            </div>
                        </div>

                        <div className="pa-grid">
                            {filteredAreas.map(area => (
                                <div key={area.id} className="pa-card solid-card">
                                    <div className="pa-card__header">
                                        <span className="pa-card__type">{typeLabels[area.type] || area.type}</span>
                                        {area.threat_level && (
                                            <span className={`pa-card__threat pa-card__threat--${area.threat_level}`}>
                                                {area.threat_level}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="pa-card__name">{area.name}</h3>
                                    <div className="pa-card__info">
                                        <span>{area.state}</span>
                                        {area.area_sqkm && <span>{Number(area.area_sqkm).toLocaleString('en-IN')} km2</span>}
                                        {area.established_year && <span>Est. {area.established_year}</span>}
                                    </div>
                                    {area.notable_species && area.notable_species.length > 0 && (
                                        <div className="pa-card__species">
                                            {area.notable_species.map((s, i) => <span key={i} className="pa-card__species-tag">{s}</span>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'directory' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <h2>Stakeholder Directory</h2>
                            <p>Contact information for forest department officials, pollution boards, legal bodies, and conservation NGOs across India.</p>
                        </div>
                        {directory.length === 0 ? (
                            <div className="solid-card resources-tab__empty">
                                <h3>Directory data being compiled</h3>
                                <p>Stakeholder contacts for key forest states are being gathered. This section will be populated with DFO contacts, SPCB offices, NGT bench details, and partner NGO information.</p>
                            </div>
                        ) : (
                            <table className="resources-tab__table resources-tab__table--full">
                                <thead>
                                    <tr><th>Name</th><th>Role</th><th>State</th><th>Category</th><th>Contact</th></tr>
                                </thead>
                                <tbody>
                                    {directory.map(d => (
                                        <tr key={d.id}>
                                            <td>{d.name}</td>
                                            <td>{d.role}</td>
                                            <td>{d.state}</td>
                                            <td>{d.category}</td>
                                            <td>{d.phone || d.email || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <h2>Action Templates</h2>
                            <p>Ready-to-use templates for filing complaints, RTI applications, and legal notices related to forest conservation violations.</p>
                        </div>
                        <div className="resources-tab__grid">
                            {[
                                {
                                    id: 'rti-diversion',
                                    title: 'RTI Application — Forest Land Diversion',
                                    desc: 'Request information about forest land diversion proposals, compensatory afforestation compliance, and environmental clearances under the Forest Conservation Act.',
                                    content: `To,\nThe PIO / CPIO,\n[Name of Forest Department / MoEFCC Regional Office]\n[Address]\n\nSubject: Request for Information under RTI Act, 2005\n\nDear Sir/Madam,\n\nUnder the provisions of the Right to Information Act, 2005, I would like to request the following information:\n\n1. Details of all forest land diversion proposals received under the Forest Conservation Act, 1980 for [State/District] during [Year].\n2. Status of compensatory afforestation for approved diversions.\n3. Copies of Stage-I and Stage-II approvals granted.\n4. Details of compliance reports submitted by user agencies.\n5. Total area of forest land diverted and compensatory land identified.\n\nI am willing to pay the prescribed fee for the above information.\n\nThanking you,\n[Your Name]\n[Address]\n[Date]`
                                },
                                {
                                    id: 'ngt-complaint',
                                    title: 'Complaint to National Green Tribunal',
                                    desc: 'Template for filing an original application at the NGT for environmental violations causing substantial damage to forests or biodiversity.',
                                    content: `BEFORE THE NATIONAL GREEN TRIBUNAL\n[PRINCIPAL BENCH / REGIONAL BENCH at ___]\n\nORIGINAL APPLICATION No. ___ of ___\n\nIN THE MATTER OF:\n\n[Applicant Name], [Organisation]     ... Applicant\nVs.\n[Respondent — e.g. State Forest Dept / Company]  ... Respondent\n\nSUBJECT: [Brief description of environmental violation]\n\nFACTS OF THE CASE:\n1. [Describe the violation with dates and locations]\n2. [Environmental damage caused]\n3. [Laws violated — specify sections]\n\nGROUNDS:\n- Violation of Section ___ of ___\n- Damage to forest area of approximately ___ hectares\n- [Additional grounds]\n\nRELIEF SOUGHT:\n1. Direction to stop the ongoing violation\n2. Direction for restoration of forest area\n3. Compensation for environmental damage\n4. Any other relief deemed appropriate\n\nVERIFICATION:\nI, ___, do hereby verify that the contents of this application are true to the best of my knowledge.\n\n[Signature]\n[Date]\n[Place]`
                                },
                                {
                                    id: 'fir-forest',
                                    title: 'FIR for Forest Crime',
                                    desc: 'Complaint template for reporting forest crimes (illegal logging, poaching, encroachment) to forest department or police.',
                                    content: `To,\nThe Range Forest Officer / Station House Officer,\n[Forest Range / Police Station]\n[District, State]\n\nSubject: Complaint regarding [illegal logging / poaching / encroachment] at [Location]\n\nRespected Sir/Madam,\n\nI wish to bring to your urgent attention the following:\n\nDATE & TIME: [When the violation was observed]\nLOCATION: [Specific location with GPS coordinates if available]\nNATURE OF OFFENCE: [Describe what was observed]\n\nDETAILS:\n1. [Detailed description of the violation]\n2. [Number of persons involved, if known]\n3. [Equipment/vehicles observed]\n4. [Extent of damage — area, number of trees, species affected]\n\nEVIDENCE: [Photos, GPS coordinates, witness details]\n\nI request immediate action under the relevant provisions of:\n- Indian Forest Act, 1927 (Section ___)\n- Wildlife (Protection) Act, 1972 (Section ___)\n- [Other applicable laws]\n\nThanking you,\n[Name]\n[Organisation]\n[Contact]\n[Date]`
                                }
                            ].map((template, i) => {
                                const isExpanded = expandedTemplates.includes(i);
                                return (
                                    <div key={template.id} className={`template-card solid-card ${isExpanded ? 'template-card--expanded' : ''}`}>
                                        <div
                                            className="template-card__header"
                                            onClick={() => toggleTemplate(i)}
                                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? 'var(--sp-8)' : '0' }}
                                        >
                                            <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>{template.title}</h3>
                                            <button className="template-card__toggle-btn" aria-label="Toggle details">
                                                {isExpanded ? '−' : '+'}
                                            </button>
                                        </div>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="template-card__body"
                                            >
                                                <p className="template-card__desc">{template.desc}</p>
                                                <div className="template-card__content-wrapper" style={{ position: 'relative' }}>
                                                    <div className="template-card__content">
                                                        <pre>{template.content}</pre>
                                                    </div>
                                                    <button
                                                        className="template-card__copy-btn"
                                                        onClick={() => handleCopy(template.content, template.id)}
                                                    >
                                                        {copiedContent === template.id ? 'Copied!' : 'Copy to clipboard'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'funding' && (
                    <div className="resources-tab">
                        <div className="solid-card resources-tab__intro">
                            <h2>Funding and Partnership Opportunities</h2>
                            <p>Active funding programmes and partnerships relevant to forest conservation organisations in India, ranging from government funds to international grants.</p>
                        </div>
                        <div className="funding-grid">
                            {FUNDING_SOURCES.map((fund, i) => (
                                <div key={i} className="funding-card solid-card">
                                    <h3>{fund.name}</h3>
                                    <p className="funding-card__org">{fund.org}</p>
                                    <p className="funding-card__desc">{fund.desc}</p>
                                    <a href={fund.url} target="_blank" rel="noopener noreferrer" className="funding-card__link">
                                        Visit website
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
