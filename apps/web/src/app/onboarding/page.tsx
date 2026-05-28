'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { School, MapPin, Award, Upload, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('school');
  const [city, setCity] = useState('');
  const [board, setBoard] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Status states
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Handle Logo File Upload
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
        setSuccessMsg('Logo uploaded successfully!');
      } else {
        setErrorMsg('Failed to upload logo.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Onboarding Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Institution name is required.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await axios.put(`${apiURL}/api/users/me/institution`, {
        name: name.trim(),
        type,
        city: city.trim(),
        board: board.trim(),
        logoUrl,
      });

      if (response.data && response.data.success) {
        setSuccessMsg('Profile setup successfully!');
        
        await refreshUser();

        // Add a slight delay for positive UX feedback, then redirect to assignments
        setTimeout(() => {
          router.push('/assignments');
          router.refresh();
        }, 1000);
      } else {
        setErrorMsg('Onboarding failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit onboarding details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      {/* Visual Identity / Subtitle */}
      <div className="text-center mb-8">
        <span className="bg-brand/10 text-brand text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Step 2 of 2: Profile Setup
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mt-3">
          Configure your school profile
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Welcome to VedaAI, {user?.name || 'Teacher'}! Let's customize your generated exam sheets with your school details and crest.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow-xl rounded-2xl border border-border p-6 md:p-8">
        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm flex items-start gap-2 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Crest Upload Component */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Institution Logo / Crest
            </label>
            <div className="flex items-center gap-6">
              {/* Preview Circle */}
              <div className="w-20 h-20 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 relative group">
                {logoUrl ? (
                  <img
                    src={logoUrl.startsWith('/') ? `${apiURL}${logoUrl}` : logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <School className="w-8 h-8 text-text-secondary/40" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload control */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-text-primary bg-white hover:bg-surface cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-text-secondary" />
                    <span>Choose logo file</span>
                  </label>
                </div>
                <p className="mt-1.5 text-xs text-text-secondary">
                  PNG, JPEG up to 5MB. Will fallback to default placeholder if not uploaded.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-border" />

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
                className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                placeholder="e.g. St. Kabir High School"
              />
            </div>
          </div>

          {/* Type Dropdown */}
          <div>
            <label htmlFor="inst-type" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Institution Type <span className="text-brand">*</span>
            </label>
            <select
              id="inst-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            >
              <option value="school">Primary / Secondary School</option>
              <option value="college">Junior / Senior College</option>
              <option value="university">University / Higher Ed</option>
              <option value="center">Coaching Center / Institute</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  placeholder="e.g. CBSE / IB"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand hover:bg-[#D84D1B] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Saving Setup...' : 'Complete Profile Setup'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
