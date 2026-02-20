import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './Header.css';

export default function Header({ alertCount = 0, onAlertClick }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header__inner">
                {/* Logo — professional SVG, no emoji */}
                <NavLink to="/" className="header__logo">
                    <div className="header__logo-icon">
                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32" style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.15))' }}>
                            <defs>
                                <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#8B5A2B" />
                                    <stop offset="50%" stopColor="#A0522D" />
                                    <stop offset="100%" stopColor="#6B4226" />
                                </linearGradient>
                                <radialGradient id="leafBack" cx="30%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#52B788" />
                                    <stop offset="80%" stopColor="#1B4332" />
                                </radialGradient>
                                <radialGradient id="leafFront" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#74C69D" />
                                    <stop offset="80%" stopColor="#2D6A4F" />
                                </radialGradient>
                                <radialGradient id="leafTop" cx="30%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#95D5B2" />
                                    <stop offset="80%" stopColor="#40916C" />
                                </radialGradient>
                            </defs>

                            {/* Trunk */}
                            <path d="M14 18 L14 29 C14 30 15 31 16 31 C17 31 18 30 18 29 L18 18 Z" fill="url(#trunkGrad)" />

                            {/* Leaves - 3D Spheres */}
                            <circle cx="10" cy="14" r="7.5" fill="url(#leafBack)" />
                            <circle cx="22" cy="13" r="7" fill="url(#leafBack)" />
                            <circle cx="16" cy="7" r="6.5" fill="url(#leafTop)" />
                            <circle cx="16" cy="16" r="8.5" fill="url(#leafFront)" />

                            {/* Cute Smiley */}
                            <circle cx="13.5" cy="15.5" r="1.2" fill="#081C15" />
                            <circle cx="18.5" cy="15.5" r="1.2" fill="#081C15" />
                            <path d="M14.5 17 Q16 19 17.5 17" stroke="#081C15" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                            <ellipse cx="11.5" cy="16.5" rx="1.5" ry="0.8" fill="#FFB5A7" opacity="0.9" />
                            <ellipse cx="20.5" cy="16.5" rx="1.5" ry="0.8" fill="#FFB5A7" opacity="0.9" />
                        </svg>
                    </div>
                    <div className="header__logo-text">
                        <span className="header__logo-title">Where Is My Forest</span>
                        <span className="header__logo-sub">Conservation Intelligence Platform</span>
                    </div>
                </NavLink>

                {/* Desktop Nav */}
                <nav className="header__nav">
                    <NavLink to="/" className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`} end>
                        Dashboard
                    </NavLink>
                    <NavLink to="/plant" className={({ isActive }) => `header__link header__link--special ${isActive ? 'header__link--active' : ''}`}>
                        Plant a Tree 🌱
                    </NavLink>
                    <NavLink to="/news" className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}>
                        News
                    </NavLink>
                    <NavLink to="/report" className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}>
                        Report
                    </NavLink>
                    <NavLink to="/resources" className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}>
                        Resources
                    </NavLink>
                    <NavLink to="/analytics" className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}>
                        Analytics
                    </NavLink>
                </nav>

                {/* Actions */}
                <div className="header__actions">
                    <div className="header__live">
                        <span className="header__live-dot"></span>
                        <span className="header__live-text">LIVE</span>
                    </div>

                    <button
                        className={`header__hamburger ${mobileMenuOpen ? 'header__hamburger--open' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu"
                    >
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="header__mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile menu drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="header__mobile-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="header__drawer-top">
                            <span className="header__drawer-title">Menu</span>
                            <button className="header__drawer-close" onClick={() => setMobileMenuOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <nav className="header__drawer-nav">
                            <NavLink to="/" className={({ isActive }) => `header__drawer-link ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)} end>Dashboard</NavLink>
                            <NavLink to="/plant" className={({ isActive }) => `header__drawer-link header__drawer-link--plant ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Plant a Tree 🌱</NavLink>
                            <NavLink to="/news" className={({ isActive }) => `header__drawer-link ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>News</NavLink>
                            <NavLink to="/report" className={({ isActive }) => `header__drawer-link ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Report</NavLink>
                            <NavLink to="/resources" className={({ isActive }) => `header__drawer-link ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Resources</NavLink>
                            <NavLink to="/analytics" className={({ isActive }) => `header__drawer-link ${isActive ? 'header__drawer-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Analytics</NavLink>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
