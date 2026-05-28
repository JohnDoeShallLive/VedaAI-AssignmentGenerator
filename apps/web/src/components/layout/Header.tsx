'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Bell, ArrowLeft, ChevronDown, LogOut, User as UserIcon, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NotificationData {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
  createdAt: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Navigation states
  let showBack = false;
  let title = 'Home';

  if (pathname.startsWith('/assignments')) {
    title = 'Assignments';
    if (pathname.includes('/result')) {
      showBack = true;
      title = 'Assignment Result';
    }
  } else if (pathname === '/create') {
    showBack = true;
    title = 'Create Assignment';
  } else if (pathname.startsWith('/groups')) {
    title = 'My Groups';
  } else if (pathname.startsWith('/library')) {
    title = 'My Library';
  } else if (pathname.startsWith('/toolkit')) {
    title = "AI Teacher's Toolkit";
  } else if (pathname.startsWith('/settings')) {
    title = 'Account Settings';
  } else if (pathname.startsWith('/onboarding')) {
    title = 'School Profile Setup';
  }

  // Dropdowns state
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs for clicking outside
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${apiURL}/api/notifications`);
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter((n: NotificationData) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds for passive real-time experience
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const res = await axios.put(`${apiURL}/api/notifications/read-all`);
      if (res.data && res.data.success) {
        setUnreadCount(0);
        // Map locally to avoid extra fetch
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleSignOut = () => {
    logout();
  };

  // User initials helper
  const getInitials = () => {
    if (!user?.name) return 'TS';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-[264px] z-20 select-none no-print">
      {/* Left side: Back button & Title */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-surface rounded-full transition-colors active:scale-95"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
        )}
        <h1 className="text-base font-bold text-text-primary lg:text-lg">
          {title}
        </h1>
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={bellRef}>
          <button 
            onClick={() => { setBellOpen(!bellOpen); setUserMenuOpen(false); }}
            className="p-2 hover:bg-surface rounded-full transition-colors relative" 
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-text-secondary hover:text-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Bell Dropdown panel */}
          {bellOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleIn">
              <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                <span className="font-bold text-xs text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-[10px] font-bold text-brand hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification contents */}
              <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        !n.read ? 'bg-brand/5' : 'hover:bg-surface'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-text-primary leading-tight">
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-text-secondary/60 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-border"></div>

        {/* User Menu dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div 
            onClick={() => { setUserMenuOpen(!userMenuOpen); setBellOpen(false); }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm overflow-hidden select-none shrink-0 border border-brand/10">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-text-primary leading-tight max-w-[120px] truncate">
                {user?.name || 'Teacher'}
              </p>
              <p className="text-[11px] text-text-secondary leading-none mt-0.5">
                {user?.role || 'Teacher'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-transform group-hover:translate-y-0.5" />
          </div>

          {/* User Menu Panel */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleIn py-1.5 divide-y divide-border/60">
              <div className="px-4 py-2 text-left">
                <p className="text-xs font-bold text-text-primary truncate">{user?.name}</p>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link 
                  href="/settings/profile" 
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-text-secondary" />
                  <span>Profile Settings</span>
                </Link>
                <Link 
                  href="/settings/institution" 
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <Settings className="w-4 h-4 text-text-secondary" />
                  <span>Institution settings</span>
                </Link>
              </div>

              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

