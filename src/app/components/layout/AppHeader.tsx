"use client";

import React from 'react';
import { Menu } from 'lucide-react';

export default function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="md:hidden bg-brand-black border-b px-4 py-3" style={{ borderColor: "#323539" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-brand-light">The HUB</h1>
          <span className="text-xs font-medium text-brand-yellow">GravitySeries</span>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-brand-light hover:text-brand-orange transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile menu - kan expanderas senare */}
      {isMenuOpen && (
        <div className="mt-4 pb-4">
          <p className="text-sm text-brand-gray">Mobilmeny kommer här...</p>
        </div>
      )}
    </header>
  );
}
