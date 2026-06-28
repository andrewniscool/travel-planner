import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import AuthModal, { type AuthModalMode } from '../auth/AuthModal';
import { useAuth } from '../../hooks/useAuth';

const NAV_LINKS = [
  { label: 'Discover', href: '#discover' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'Journeys', href: '#journeys' },
];

const LandingLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>('sign-in');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOpenAuth = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: AuthModalMode }>;
      setAuthMode(customEvent.detail?.mode ?? 'sign-in');
      setAuthModalOpen(true);
    };

    window.addEventListener('refine:open-auth', handleOpenAuth);
    return () => window.removeEventListener('refine:open-auth', handleOpenAuth);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleAuthAction = (mode: AuthModalMode) => {
    setMobileMenuOpen(false);

    if (user) {
      navigate('/create-trip');
      return;
    }

    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Top Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-app-bg shadow-sm backdrop-blur'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span
                className={`text-xl font-extrabold tracking-normal transition-colors duration-300 ${
                  scrolled ? 'text-primary-700' : 'text-white'
                }`}
              >
                REFINE
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                    scrolled
                      ? 'text-app-text-muted hover:text-app-text'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAuthAction('sign-in')}
                className={`transition-colors duration-300 ${
                  scrolled
                    ? 'text-app-text-muted hover:bg-app-surface-muted'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => handleAuthAction('sign-up')}
                className="bg-primary-600 text-white hover:bg-primary-700"
              >
                Sign up
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X
                  className={`w-6 h-6 transition-colors duration-300 ${
                    scrolled ? 'text-neutral-900' : 'text-white'
                  }`}
                />
              ) : (
                <Menu
                  className={`w-6 h-6 transition-colors duration-300 ${
                    scrolled ? 'text-neutral-900' : 'text-white'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg border-t border-neutral-100">
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="block px-3 py-2 text-sm font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleAuthAction('sign-in')}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Log in
                </button>
                <Button
                  size="sm"
                  onClick={() => handleAuthAction('sign-up')}
                  className="w-full bg-primary-600 text-white hover:bg-primary-700"
                >
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main><Outlet /></main>
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        returnTo="/create-trip"
      />
    </div>
  );
};

export default LandingLayout;
