import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Compass, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
];

const LandingLayout: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Compass
                className={`w-8 h-8 transition-colors duration-300 ${
                  scrolled ? 'text-primary-600' : 'text-white'
                }`}
              />
              <span
                className={`text-xl font-bold transition-colors duration-300 ${
                  scrolled ? 'text-neutral-900' : 'text-white'
                }`}
              >
                Travel Builder
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
                      ? 'text-neutral-600 hover:text-neutral-900'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-colors duration-300 ${
                    scrolled
                      ? 'text-neutral-600 hover:bg-neutral-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
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
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main><Outlet /></main>
    </div>
  );
};

export default LandingLayout;
