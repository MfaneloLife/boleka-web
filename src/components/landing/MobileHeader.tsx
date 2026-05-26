"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 -ml-2 rounded-md hover:bg-gray-50"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
          BOLEKA
        </Link>

        {/* Auth */}
        <div className="flex items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full border border-orange-400 bg-white px-4 py-1.5 text-sm font-medium text-orange-500 hover:bg-orange-50 transition">
                Sign up / Login
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg">
          <nav className="flex flex-col px-4 py-4 space-y-3">
            <Link href="/" className="text-gray-800 font-medium py-2" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/search" className="text-gray-800 font-medium py-2" onClick={() => setMenuOpen(false)}>Search</Link>
            <Link href="/dashboard" className="text-gray-800 font-medium py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-left text-orange-500 font-medium py-2">Sign up / Login</button>
              </SignInButton>
            </SignedOut>
          </nav>
        </div>
      )}
    </header>
  );
}
