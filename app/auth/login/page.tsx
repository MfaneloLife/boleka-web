"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Minimal top bar */}
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            BOLEKA
          </Link>
          <Link
            href={`/auth/signup${redirectUrl !== "/" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="rounded-full border border-orange-300 bg-white px-3 py-1.5 text-sm font-medium text-orange-600 shadow-sm transition hover:bg-orange-50"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Centered card region */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Brand heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your Boleka account</p>
          </div>

          {/* Clerk card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SignIn
              path="/auth/login"
              routing="path"
              signUpUrl={`/auth/signup${redirectUrl !== "/" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
              forceRedirectUrl={redirectUrl}
              appearance={{
                variables: {
                  colorPrimary: "#f97316",
                  colorText: "#1e293b",
                  colorTextSecondary: "#64748b",
                  colorBackground: "#ffffff",
                  colorInputBackground: "#f8fafc",
                  colorBorder: "#e2e8f0",
                  colorInputText: "#1e293b",
                  borderRadius: "0.75rem",
                  fontFamily: "inherit",
                },
                elements: {
                  card: "shadow-none border-0 p-0",
                  headerTitle: "text-slate-900",
                  headerSubtitle: "text-slate-500",
                  socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50",
                  socialButtonsBlockButtonText: "text-slate-700 font-medium",
                  dividerLine: "bg-slate-200",
                  dividerText: "text-slate-400",
                  formFieldInput: "rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100",
                  formButtonPrimary:
                    "bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-semibold normal-case",
                  footerActionLink: "text-orange-600 hover:text-orange-700 font-medium",
                  identityPreviewEditButton: "text-orange-600",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
            />
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            By signing in, you agree to Boleka's{" "}
            <Link href="/safety" className="text-orange-600 underline">
              Terms & Safety
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
