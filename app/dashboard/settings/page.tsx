'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  User, MapPin, Globe, Store, Bell, Shield,
  Loader2, Save, ChevronDown, Camera, ChevronRight,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { COUNTRIES, COUNTRY_LIST } from '@/src/lib/countries';

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  bio: string;
  dateOfBirth: string | null;
  country: string;
  region: string;
  city: string;
  suburb: string;
  address: string;
  businessName: string;
  businessDescription: string;
  returnWindowHours: number;
  lateFeePerDay: number;
  language: string;
  profileCompleted: boolean;
  hasBusinessProfile: boolean;
}

type SectionKey = 'personal' | 'location' | 'business' | 'preferences' | 'account';

export default function SettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    personal: false,
    location: false,
    business: false,
    preferences: false,
    account: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', phone: '', bio: '', dateOfBirth: '',
    country: 'ZA', region: '', city: '', suburb: '', address: '',
    businessName: '', businessDescription: '',
    returnWindowHours: 48, lateFeePerDay: 50,
    language: 'en',
  });

  const [selectedCountry, setSelectedCountry] = useState('ZA');
  const [availableRegions, setAvailableRegions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const country = COUNTRIES[selectedCountry];
    setAvailableRegions(country?.regions || []);
  }, [selectedCountry]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const country = data.country || 'ZA';
        setSelectedCountry(country);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          country: country,
          region: data.region || '',
          city: data.city || '',
          suburb: data.suburb || '',
          address: data.address || '',
          businessName: data.businessName || '',
          businessDescription: data.businessDescription || '',
          returnWindowHours: data.returnWindowHours || 48,
          lateFeePerDay: data.lateFeePerDay || 50,
          language: data.language || 'en',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setSaving(section);
      setSaved('');

      const payload: any = {};
      if (section === 'personal') {
        payload.name = form.name;
        payload.phone = form.phone;
        payload.bio = form.bio;
        payload.dateOfBirth = form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null;
      } else if (section === 'location') {
        payload.country = form.country;
        payload.region = form.region;
        payload.city = form.city;
        payload.suburb = form.suburb;
        payload.address = form.address;
      } else if (section === 'business') {
        payload.businessName = form.businessName;
        payload.businessDescription = form.businessDescription;
        payload.returnWindowHours = Number(form.returnWindowHours);
        payload.lateFeePerDay = Number(form.lateFeePerDay);
      } else if (section === 'preferences') {
        payload.language = form.language;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(section);
        fetchProfile();
        setTimeout(() => setSaved(''), 2000);
      } else {
        const err = await res.json();
        console.error('Save error:', err);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(null);
    }
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving('photo');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload/r2', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: uploadData.url }),
        });
        fetchProfile();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
      </div>
    );
  }

  const SectionToggle = ({ section, label, icon: Icon }: { section: SectionKey; label: string; icon: any }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between px-4 py-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-orange-500" />
        </div>
        <div className="text-left">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          <p className="text-xs text-gray-400 mt-0.5">
            {section === 'personal' && 'Name, phone, bio, date of birth'}
            {section === 'location' && 'Country, region, city, address'}
            {section === 'business' && 'Business name, description, rental policies'}
            {section === 'preferences' && 'Language, notifications'}
            {section === 'account' && 'Privacy, security, delete account'}
          </p>
        </div>
      </div>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSections[section] ? 'rotate-180' : ''}`} />
    </button>
  );

  const InputField = ({ label, value, onChange, placeholder, type = 'text', required }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  const TextareaField = ({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white resize-none"
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );

  const SaveButton = ({ section }: { section: string }) => (
    <button
      onClick={() => handleSave(section)}
      disabled={saving === section}
      className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 shadow-sm"
    >
      {saving === section ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved === section ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saving === section ? 'Saving...' : saved === section ? 'Saved!' : 'Save'}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your profile, location, and preferences</p>
        </div>
      </div>

      {/* Profile Avatar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden ring-2 ring-orange-100">
            {profile?.image ? (
              <img src={profile.image} alt="" className="w-full h-full object-cover" />
            ) : (
              form.name?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition"
          >
            <Camera className="w-3 h-3 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{profile?.name || user?.fullName || 'User'}</p>
          <p className="text-sm text-gray-500 truncate">{profile?.email || user?.emailAddresses?.[0]?.emailAddress || ''}</p>
          {profile?.phone && <p className="text-xs text-gray-400">{profile.phone}</p>}
          {profile?.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{profile.bio}</p>}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* ===== 1. PERSONAL INFO ===== */}
        <SectionToggle section="personal" label="Personal Information" icon={User} />
        {openSections.personal && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Your full name" />
              <InputField label="Phone Number" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+27 XX XXX XXXX" type="tel" />
            </div>
            <TextareaField label="Bio / About Me" value={form.bio} onChange={v => setForm(p => ({ ...p, bio: v }))} placeholder="Tell people a little about yourself..." />
            <InputField label="Date of Birth" value={form.dateOfBirth} onChange={v => setForm(p => ({ ...p, dateOfBirth: v }))} type="date" />
            <div className="flex justify-end">
              <SaveButton section="personal" />
            </div>
          </div>
        )}

        {/* ===== 2. LOCATION & CONTACT ===== */}
        <SectionToggle section="location" label="Location & Contact Details" icon={MapPin} />
        {openSections.location && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Country</label>
                <select
                  value={form.country}
                  onChange={e => {
                    setForm(p => ({ ...p, country: e.target.value, region: '' }));
                    setSelectedCountry(e.target.value);
                  }}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
                >
                  {COUNTRY_LIST.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {selectedCountry === 'US' ? 'State' : 'Region / Province'}
                </label>
                <select
                  value={form.region}
                  onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
                >
                  <option value="">Select {selectedCountry === 'US' ? 'State' : 'Region'}</option>
                  {availableRegions.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="City" value={form.city} onChange={v => setForm(p => ({ ...p, city: v }))} placeholder="e.g. Johannesburg" />
              <InputField label="Suburb / District" value={form.suburb} onChange={v => setForm(p => ({ ...p, suburb: v }))} placeholder="e.g. Sandton" />
              <InputField label="Street Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="123 Main St" />
            </div>
            <div className="flex justify-end">
              <SaveButton section="location" />
            </div>
          </div>
        )}

        {/* ===== 3. BUSINESS PROFILE ===== */}
        <SectionToggle section="business" label="Business Profile" icon={Store} />
        {openSections.business && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 animate-fadeIn">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">Set up your business profile to list items as a vendor. This information will be shown to renters.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Business Name" value={form.businessName} onChange={v => setForm(p => ({ ...p, businessName: v }))} placeholder="Your business name" />
              <InputField label="Contact Number" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+27 XX XXX XXXX" type="tel" />
            </div>
            <TextareaField label="Business Description" value={form.businessDescription} onChange={v => setForm(p => ({ ...p, businessDescription: v }))} placeholder="Describe what your business offers..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Return Window (hours)</label>
                <input
                  type="number"
                  min={1}
                  value={form.returnWindowHours}
                  onChange={e => setForm(p => ({ ...p, returnWindowHours: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Late Fee (per day, ZAR)</label>
                <input
                  type="number"
                  min={0}
                  value={form.lateFeePerDay}
                  onChange={e => setForm(p => ({ ...p, lateFeePerDay: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <SaveButton section="business" />
            </div>
          </div>
        )}

        {/* ===== 4. PREFERENCES ===== */}
        <SectionToggle section="preferences" label="Preferences" icon={Bell} />
        {openSections.preferences && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-medium text-gray-600">Language</label>
              <select
                value={form.language}
                onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">isiZulu</option>
                <option value="xh">isiXhosa</option>
                <option value="st">Sesotho</option>
                <option value="tn">Setswana</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-gray-700">Push Notifications</span>
                <p className="text-xs text-gray-400 mt-0.5">Get notified about requests and updates</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${notifications ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex justify-end">
              <SaveButton section="preferences" />
            </div>
          </div>
        )}

        {/* ===== 5. ACCOUNT ===== */}
        <SectionToggle section="account" label="Account" icon={Shield} />
        {openSections.account && (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 rounded-xl overflow-hidden animate-fadeIn">
            <a href="/auth/profile-setup" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Vendor Profile Setup</span>
                  <p className="text-xs text-gray-400 mt-0.5">Complete your vendor registration</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </a>
            <div className="flex items-center justify-between px-5 py-4 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Privacy & Security</span>
                  <p className="text-xs text-gray-400 mt-0.5">Coming soon</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {/* Display info card */}
      {profile && (profile.city || profile.region) && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">
              📍 {[profile.city, profile.suburb, profile.region, profile.country].filter(Boolean).join(', ')}
            </span>
          </div>
          {profile.businessName && (
            <div className="flex items-center gap-2 mt-2">
              <Store className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">🏪 {profile.businessName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
