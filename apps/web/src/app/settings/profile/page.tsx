'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { updatePassword } from 'firebase/auth';
import axios from 'axios';
import { User, Mail, Lock, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, firebaseUser, refreshUser } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${apiURL}/api/users/me`);
        if (res.data && res.data.success) {
          setName(res.data.data.name);
          setAvatarUrl(res.data.data.avatarUrl || '');
        }
      } catch (err) {
        console.error('Failed to retrieve profile data:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle Avatar Image Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setAvatarUrl(response.data.url);
        setSuccessMsg('Avatar uploaded successfully!');
      } else {
        setErrorMsg('Failed to upload avatar.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (password && password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password && password !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        name: name.trim(),
        avatarUrl,
      };

      if (password) {
        if (firebaseUser) {
          await updatePassword(firebaseUser, password);
        } else {
          setErrorMsg('Authentication error. Please re-login to update password.');
          setSaving(false);
          return;
        }
      }

      const res = await axios.put(`${apiURL}/api/users/me`, payload);

      if (res.data && res.data.success) {
        setSuccessMsg('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
        
        // Sync session data with backend / Firebase if needed
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile settings.');
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
        <Link href="/settings/profile" className="border-b-2 border-brand py-3 px-6 text-sm font-semibold text-brand">
          Profile Settings
        </Link>
        <Link href="/settings/institution" className="border-b-2 border-transparent py-3 px-6 text-sm font-semibold text-text-secondary hover:text-text-primary">
          Institution Profile
        </Link>
      </div>

      {/* Main Settings Card */}
      {loadingUser ? (
        <div className="bg-white border border-border rounded-3xl py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-text-secondary">Retrieving profile...</p>
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
            {/* Avatar Row */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2.5">
                Profile Photo
              </label>
              <div className="flex items-center gap-5">
                {/* Photo frame */}
                <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand text-xl font-bold border border-brand/10 overflow-hidden shrink-0 relative group select-none">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl.startsWith('/') ? `${apiURL}${avatarUrl}` : avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    name.slice(0, 2).toUpperCase()
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/png, image/jpeg"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-xs font-semibold text-text-primary bg-white hover:bg-surface cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Upload new image</span>
                  </label>
                  <p className="mt-1 text-[10px] text-text-secondary">
                    PNG, JPEG up to 2MB.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Display Name */}
            <div>
              <label htmlFor="user-name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Display Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="Teacher Name"
                />
              </div>
            </div>

            {/* Read-Only Email */}
            <div>
              <label htmlFor="user-email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm opacity-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="user-email"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="block w-full pl-10 pr-3 py-2 bg-[#F3F4F6] border border-border rounded-xl text-sm cursor-not-allowed text-text-secondary"
                />
              </div>
              <p className="mt-1 text-[10px] text-text-secondary">
                Registered email addresses cannot be modified.
              </p>
            </div>

            {/* Optional Password Update (Only shown if Credentials User) */}
            <div className="border-t border-border/60 pt-5 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-text-primary">Change Password</h4>
                <p className="text-xs text-text-secondary mt-0.5">Leave blank if you do not want to alter credentials.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label htmlFor="new-pass" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-secondary" />
                    </div>
                    <input
                      id="new-pass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="new-pass-confirm" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-text-secondary" />
                    </div>
                    <input
                      id="new-pass-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save CTA */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-brand hover:bg-[#D84D1B] disabled:opacity-50 active:scale-95 transition-all shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>Save Profile Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
