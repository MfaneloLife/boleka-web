"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-semibold tracking-tight text-slate-900">BOLEKA</Link>
          </div>
          <Link
            href="/auth/signup"
            className="rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-sm transition hover:bg-orange-50"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Discover</p>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                One account. All the features.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Sign in with Clerk to unlock renting, listing, chat, payments and vendor return terms in one shared account.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
                Mobile friendly UI
              </span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                Secure payments via PayFast
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sign in to your account</h2>
              <p className="text-sm text-slate-500">Use your existing account or create one with Clerk.</p>
            </div>
            <Link href="/" className="text-sm font-medium text-orange-600 hover:text-orange-700">
              Back to home
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
            <SignIn path="/auth/login" routing="path" signUpUrl="/auth/signup" />
          </div>
        </section>
      </main>
    </div>
  );
}