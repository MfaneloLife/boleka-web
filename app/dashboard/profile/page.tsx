"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save, User, MapPin, Building, Phone, Mail } from "lucide-react";

interface Profile {
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  bio: string | null;
  country: string;
  region: string;
  city: string;
  suburb: string;
  address: string;
  businessName: string | null;
  businessDescription: string | null;
  returnWindowHours: number;
  lateFeePerDay: number;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
        <p className="text-gray-400 text-sm">Loading profile...</p>
      </div>
    );
  }

  const update = (key: keyof Profile, value: string | number | null) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your personal info and business profile</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "Saved!" : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" /> Personal Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              value={profile?.name || ""}
              onChange={(e) => update("name", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
            <input
              value={profile?.email || ""}
              disabled
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Managed by your account provider</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
            <input
              value={profile?.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="+27 123 456 789"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">Bio</label>
          <textarea
            value={profile?.bio || ""}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
            placeholder="Tell others a bit about yourself..."
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" /> Location
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Country</label>
            <input
              value={profile?.country || ""}
              onChange={(e) => update("country", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="e.g. South Africa"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Region / Province</label>
            <input
              value={profile?.region || ""}
              onChange={(e) => update("region", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="e.g. Gauteng"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">City</label>
            <input
              value={profile?.city || ""}
              onChange={(e) => update("city", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="e.g. Johannesburg"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Suburb</label>
            <input
              value={profile?.suburb || ""}
              onChange={(e) => update("suburb", e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
              placeholder="e.g. Sandton"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">Full Address</label>
          <input
            value={profile?.address || ""}
            onChange={(e) => update("address", e.target.value)}
            className="w-full mt-1.5 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
            placeholder="Street address"
          />
        </div>
      </div>

    </div>
  );
}