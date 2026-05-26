"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold tracking-tight text-slate-900">BOLEKA</span>
          </div>
          <Link
            href="/auth/login"
            className="rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-sm transition hover:bg-orange-50"
          >
            Login instead
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Welcome</p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Create your BOLEKA account</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Sign up with Clerk and access listing, renting, chat, billing and vendor return terms from a single account.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sign up now</h2>
              <p className="text-sm text-slate-500">Quick sign-up with email or social providers.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
            <SignUp path="/auth/signup" routing="path" signInUrl="/auth/login" />
          </div>
        </section>
      </main>
    </div>
  );
}
