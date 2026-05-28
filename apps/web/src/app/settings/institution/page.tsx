'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { School, MapPin, Award, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function InstitutionSettingsPage() {
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('school');
  const [city, setCity] = useState('');
  const [board, setBoard] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Status states
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const res = await axios.get(`${apiURL}/api/users/me`);
        if (res.data && res.data.success && res.data.data.institution) {
          const inst = res.data.data.institution;
          setName(inst.name || '');
          setType(inst.type || 'school');
          setCity(inst.city || '');
          setBoard(inst.board || '');
          setLogoUrl(inst.logoUrl || '');
        }
      } catch (err) {
        console.error('Failed to retrieve institution details:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchInstitutionData();
  }, []);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiURL}/api/users/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setLogoUrl(response.data.url);
        setSuccessMsg('Logo crest uploaded successfully!');
      } else {
        setErrorMsg('Failed to upload logo crest.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // Submit Institution Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await axios.put(`${apiURL}/api/users/me/institution`, {
        name: name.trim(),
        type,
        city: city.trim(),
        board: board.trim(),
        logoUrl,
      });

      if (res.data && res.data.success) {
        setSuccessMsg('Institution details updated successfully!');
        
        // Dispatch an event to reload page parameters where needed
        window.dispatchEvent(new Event('institution-updated'));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update institution details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary md:text-2xl">Account Settings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your teacher profile credentials and preferences.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border">
        <Link href="/settings/profile" className="border-b-2 border-transparent py-3 px-6 text-sm font-semibold text-text-secondary hover:text-text-primary">
          Profile Settings
        </Link>
        <Link href="/settings/institution" className="border-b-2 border-brand py-3 px-6 text-sm font-semibold text-brand">
          Institution Profile
        </Link>
      </div>

      {/* Main Form Card */}
      {loadingUser ? (
        <div className="bg-white border border-border rounded-3xl py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-text-secondary">Retrieving institution profile...</p>
        </div>
      ) : (
        <div className="bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm flex items-start gap-2 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Crest Row */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2.5">
                Institution Crest / Logo
              </label>
              <div className="flex items-center gap-5">
                {/* Crest preview frame */}
                <div className="w-20 h-20 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoUrl ? (
                    <img
                      src={logoUrl.startsWith('/') ? `${apiURL}${logoUrl}` : logoUrl}
                      alt="Crest Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <School className="w-8 h-8 text-text-secondary/40" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload action */}
                <div>
                  <input
                    type="file"
                    id="logo-upload-settings"
                    accept="image/png, image/jpeg"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                  <label
                    htmlFor="logo-upload-settings"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-xs font-semibold text-text-primary bg-white hover:bg-surface cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Upload new crest</span>
                  </label>
                  <p className="mt-1 text-[10px] text-text-secondary">
                    PNG, JPEG up to 5MB. Will override standard exam blueprints header branding immediately.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Institution Name */}
            <div>
              <label htmlFor="inst-name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Institution Name <span className="text-brand">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="inst-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="e.g. St. Kabir High School"
                />
              </div>
            </div>

            {/* Type Selector */}
            <div>
              <label htmlFor="inst-type" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Institution Type <span className="text-brand">*</span>
              </label>
              <select
                id="inst-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="block w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
              >
                <option value="school">Primary / Secondary School</option>
                <option value="college">Junior / Senior College</option>
                <option value="university">University / Higher Ed</option>
                <option value="center">Coaching Center / Institute</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label htmlFor="inst-city" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  City / Town
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-text-secondary" />
                  </div>
                  <input
                    id="inst-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>

              {/* Affiliation / Board */}
              <div>
                <label htmlFor="inst-board" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Affiliation / Board
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Award className="h-4 w-4 text-text-secondary" />
                  </div>
                  <input
                    id="inst-board"
                    type="text"
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                    placeholder="e.g. CBSE / State Board"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving || uploading || !name.trim()}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-brand hover:bg-[#D84D1B] disabled:opacity-50 active:scale-95 transition-all shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <School className="w-3.5 h-3.5" />
                )}
                <span>Save Institution Details</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
