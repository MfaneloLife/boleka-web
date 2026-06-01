"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser, useAuth } from "@clerk/nextjs";
import {
  Home,
  Search,
  Store,
  Wallet,
  MessageSquare,
  Settings,
  LogIn,
  UserPlus,
  PlusCircle,
  Menu,
  X,
  Heart,
  ClipboardList,
  ShoppingBag,
  Bell,
  Star,
  Award,
  Shield,
  HelpCircle,
  User,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";
import { usePWAInstall } from "@/src/context/PWAInstallContext";

// ── Navigation definitions ──
const publicNav = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shops", href: "/?tab=shops", icon: Store },
  { name: "Favourites", href: "/?tab=favourites", icon: Heart },
];

const accountItems = [
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "My Requests", href: "/dashboard/requests", icon: ClipboardList },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "My Shop", href: "/dashboard/items", icon: Store, badge: "Sell" },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Rewards", href: "/dashboard/rewards", icon: Award },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

const moreItems = [
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Get the App", href: "/install", icon: Download },
  { name: "Help & Support", href: "/support", icon: HelpCircle },
  { name: "Safety Tips", href: "/safety", icon: Shield },
];

interface AppShellProps {
  children: React.ReactNode;
  variant?: "public" | "dashboard";
  onTabChange?: (tab: string) => void;
}

// ── Reusable sidebar nav content (used by both public desktop sidebar + mobile flyout) ──
function SidebarContent({
  user,
  isLoaded,
  pathname,
  onClose,
  handleNavClick,
  onTabChange,
  signOut,
  router,
  expandedSection,
  toggleSection,
}: {
  user: ReturnType<typeof useUser>["user"];
  isLoaded: boolean;
  pathname: string | null;
  onClose: () => void;
  handleNavClick: (href: string) => void;
  onTabChange?: (tab: string) => void;
  signOut: () => void;
  router: ReturnType<typeof useRouter>;
  expandedSection: string | null;
  toggleSection: (section: string) => void;
}) {
  const { canInstall, installApp } = usePWAInstall();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/?")) return pathname === "/";
    return pathname?.startsWith(href.split("?")[0]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">BOLEKA</span>
        </Link>
        {/* Close button — only shown on mobile flyout */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* User greeting / auth prompt */}
      {isLoaded && user ? (
        <div className="px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.fullName || user.emailAddresses?.[0]?.emailAddress || "User"}
              </p>
              <p className="text-xs text-gray-500">Welcome back! 👋</p>
            </div>
          </div>
        </div>
      ) : isLoaded ? (
        <div className="px-5 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 shrink-0">
          <p className="text-sm text-gray-600 mb-3">Join the community</p>
          <SignInButton mode="modal">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all text-sm"
            >
              Sign Up / Login
            </button>
          </SignInButton>
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-0.5">
        {/* Main Navigation (always visible) */}
        <p className="px-2 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main</p>
        {publicNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href.startsWith("/?") ? "/" : item.href}
              onClick={() => { handleNavClick(item.href); onClose(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href) ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {/* List Item CTA (always visible in sidebar) */}
        <Link
          href={user ? "/dashboard/items?action=list" : "/auth/login"}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-md transition-all mt-2"
        >
          <PlusCircle className="w-5 h-5" />
          List an Item — It's Free
        </Link>

        {/* Install App button (Android only) */}
        {canInstall && (
          <button
            onClick={() => { installApp(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-all w-full mt-2"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
        )}

        {/* Invite Friends button */}
        <button
          onClick={() => {
            const shareData: ShareData = {
              title: 'BOLEKA - Rent & Share Items',
              text: 'Check out BOLEKA! Rent items from people near you or list your own items to earn money. 🎒📸🎮',
              url: window.location.origin,
            };
            
            if (navigator.share && navigator.canShare?.(shareData)) {
              navigator.share(shareData).catch(() => {});
            } else {
              // Fallback: copy link
              navigator.clipboard.writeText(window.location.origin).then(() => {
                alert('Link copied! Share it with your friends.');
              }).catch(() => {
                prompt('Share this link:', window.location.origin);
              });
            }
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all w-full mt-2"
        >
          <Share2 className="w-5 h-5" />
          Invite Friends
        </button>

        {/* Account Section (signed in only) */}
        <SignedIn>
          <button
            onClick={() => toggleSection("account")}
            className="flex items-center justify-between w-full px-2 py-2 mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
          >
            <span>Account</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expandedSection === "account" ? "rotate-90" : ""}`} />
          </button>
          {(expandedSection === "account" || expandedSection === null) && (
            <div className="space-y-0.5">
              {accountItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href) ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {"badge" in item && (
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">Sell</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* More Section */}
          <p className="px-2 py-2 mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">More</p>
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href) ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </SignedIn>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-4 space-y-2 shrink-0">
        {isLoaded && !user ? (
          <>
            <SignInButton mode="modal">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all">
                <LogIn className="w-5 h-5" />
                Log in
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm">
                <UserPlus className="w-5 h-5" />
                Sign up
              </button>
            </SignInButton>
          </>
        ) : isLoaded && user ? (
          <button
            onClick={() => { signOut(); router.push("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        ) : null}
        <p className="text-[10px] text-gray-400 text-center">Boleka v1.0 • Rent & Share items</p>
      </div>
    </div>
  );
}

export default function AppShell({ children, variant = "public", onTabChange }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleNavClick = useCallback(
    (href: string) => {
      setSidebarOpen(false);
      if (href.startsWith("/?tab=") && onTabChange) {
        const tab = href.replace("/?tab=", "");
        onTabChange(tab);
      }
    },
    [onTabChange]
  );

  const isDashboard = variant === "dashboard";

  // Shared sidebar content props
  const sidebarProps = {
    user,
    isLoaded,
    pathname,
    onClose: () => setSidebarOpen(false),
    handleNavClick,
    onTabChange,
    signOut,
    router,
    expandedSection,
    toggleSection,
  };

  // ── Desktop sidebar (for dashboard variant) ──
  if (isDashboard) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="lg:hidden bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <Link href="/" className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-gray-900">BOLEKA</span>
              </Link>
              <div className="w-9 h-9" />
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="px-4 py-5 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  // ── Public variant - persistent sidebar on desktop, flyout on mobile ──
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile flyout overlay (hidden on desktop) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />

          {/* Flyout panel */}
          <div className="fixed inset-y-0 left-0 w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col animate-slide-in-left">
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Persistent desktop sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-white shadow-xl">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main content area (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-72">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Spacer on desktop to align with content */}
            <div className="hidden lg:block w-9" />

            {/* Logo (hidden on desktop since sidebar shows it) */}
            <Link href="/" className="lg:hidden flex items-center gap-1.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-sm tracking-tight">B</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">BOLEKA</span>
            </Link>

            {/* Auth + List Item */}
            <div className="flex items-center gap-2">
              <Link
                href={user ? "/dashboard/items?action=list" : "/auth/login"}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 text-xs font-semibold hover:shadow-lg hover:shadow-orange-200/50 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                List Item
              </Link>
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
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}