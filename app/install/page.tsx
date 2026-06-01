"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function InstallAppPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) setIsAndroid(true);
    else if (/iPad|iPhone|iPod/i.test(ua)) setIsIOS(true);
    else setIsDesktop(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-orange-100 text-sm font-medium text-orange-600 mb-6">
            <Smartphone className="w-4 h-4" />
            Mobile App
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Get the <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">BOLEKA</span> App
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Rent and sell items from your phone. Fast, secure, and always with you.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: "Instant Access", desc: "One tap to browse items, no browser needed" },
            { icon: Shield, title: "Secure Payments", desc: "PayFast integrated, 95% goes to vendors" },
            { icon: Globe, title: "Offline Ready", desc: "Browse cached items even without internet" },
            { icon: Smartphone, title: "Push Notifications", desc: "Get messages and updates instantly" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Install Instructions */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {isAndroid && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Install on Android</h2>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-gray-700 font-medium mb-4">Choose your method:</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-medium text-gray-900">Chrome Menu Install</p>
                      <p className="text-sm text-gray-500 mt-1">Tap the ⋮ (3 dots) menu in Chrome → "Add to Home Screen" → Install</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-medium text-gray-900">Download APK</p>
                      <p className="text-sm text-gray-500 mt-1">Download the APK file and install it directly on your Android device</p>
                      <a
                        href="/boleka.apk"
                        download
                        className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download APK
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isIOS && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Install on iPhone / iPad</h2>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="space-y-4 text-left">
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-medium text-gray-900">Open in Safari</p>
                      <p className="text-sm text-gray-500 mt-1">Open <strong>boleka-web8.vercel.app</strong> in Safari (not Chrome)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-medium text-gray-900">Tap the Share button</p>
                      <p className="text-sm text-gray-500 mt-1">Tap <strong>Share</strong> (square with arrow) at the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-medium text-gray-900">Add to Home Screen</p>
                      <p className="text-sm text-gray-500 mt-1">Scroll down and tap <strong>"Add to Home Screen"</strong> → Tap "Add"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDesktop && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Install BOLEKA on your phone</h2>
              <p className="text-gray-600 mb-6">
                Open <strong>boleka-web8.vercel.app</strong> on your mobile device to install the app.
              </p>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-4">Scan this QR code with your phone camera:</p>
                <div className="w-48 h-48 mx-auto bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">QR code will render at: boleka-web8.vercel.app</span>
                </div>
                <a
                  href="/boleka.apk"
                  download
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download APK for Android
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="text-center pb-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
          ← Back to BOLEKA
        </Link>
      </div>
    </div>
  );
}