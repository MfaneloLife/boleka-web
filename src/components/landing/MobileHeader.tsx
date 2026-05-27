"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import {
  X,
  Home,
  Search,
  Store,
  Heart,
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Wallet,
  Package,
  PlusCircle,
  Building2,
  User,
  Settings,
  Bell,
  Star,
  Award,
  Shield,
  HelpCircle,
  LogOut,
  Menu,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  FileText,
  MapPin,
} from "lucide-react";

const navigation = {
  main: [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Shops", href: "/?tab=shops", icon: Store },
    { name: "Favourites", href: "/?tab=favourites", icon: Heart },
  ],
  account: {
    label: "Account",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Messages", href: "/messages", icon: MessageSquare },
      { name: "My Requests", href: "/dashboard/requests", icon: ClipboardList },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
      { name: "My Shop", href: "/dashboard/shop", icon: Store, badge: "Sell" },
      { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
      { name: "Rewards", href: "/dashboard/rewards", icon: Award },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
      { name: "Profile", href: "/dashboard/profile", icon: User },
    ],
  },
  more: [
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/support", icon: HelpCircle },
    { name: "Safety Tips", href: "/safety", icon: Shield },
  ],
};

interface MobileHeaderProps {
  onTabChange?: (tab: string) => void;
}

export default function MobileHeader({ onTabChange }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { user } = useUser();
  const pathname = usePathname();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    // Handle tab navigation for main pages with query param tabs
    if (href.startsWith("/?tab=") && onTabChange) {
      const tab = href.replace("/?tab=", "");
      onTabChange(tab);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white font-bold text-sm tracking-tight">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            BOLEKA
          </span>
        </Link>

        {/* Auth */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 text-sm font-semibold hover:shadow-lg hover:shadow-orange-200/50 active:scale-95 transition-all">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

      {/* Flyout overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Flyout panel */}
          <div className="fixed inset-y-0 left-0 w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col animate-slide-in-left">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                BOLEKA
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* User greeting */}
              <SignedIn>
                <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "User"}
                      </p>
                      <p className="text-xs text-gray-500">Welcome back! 👋</p>
                    </div>
                  </div>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="px-5 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <p className="text-sm text-gray-600 mb-3">Join the community</p>
                  <SignInButton mode="modal">
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all text-sm"
                    >
                      Sign Up / Login
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>

              <nav className="px-3 py-3 space-y-0.5">
                {/* Main Navigation */}
                <p className="px-2 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Main
                </p>
                {navigation.main.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href.startsWith("/?") ? "/" : item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.href)
                          ? "bg-orange-50 text-orange-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Account Section - collapsible */}
                <SignedIn>
                  <button
                    onClick={() => toggleSection("account")}
                    className="flex items-center justify-between w-full px-2 py-2 mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    <span>Account</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        expandedSection === "account" ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {(expandedSection === "account" || expandedSection === null) && (
                    <div className="space-y-0.5">
                      {navigation.account.items.map((item) => {
                        const Icon = item.icon;
                        const hasBadge = "badge" in item;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isActive(item.href)
                                ? "bg-orange-50 text-orange-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="flex-1">{item.name}</span>
                            {hasBadge && (
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                Sell
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* More Section */}
                  <p className="px-2 py-2 mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    More
                  </p>
                  {navigation.more.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive(item.href)
                            ? "bg-orange-50 text-orange-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </SignedIn>
              </nav>
            </div>

            {/* Footer */}
            <SignedIn>
              <div className="border-t border-gray-100 p-4">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-400">View profile</p>
                  </div>
                </Link>
              </div>
            </SignedIn>

            {/* Quick app info */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">
                Boleka v1.0 • Rent & Share items
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </header>
  );
}
