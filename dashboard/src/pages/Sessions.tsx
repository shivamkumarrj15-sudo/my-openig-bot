import React, { useState } from 'react';
import { Users, Plus, Shield, Globe, Trash2, RefreshCw, CheckCircle2, AlertCircle, MessageSquare, Send, Chrome, ExternalLink, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface SessionsProps {
  sessions: any[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedSessionId: (id: string) => void;
}

export const Sessions: React.FC<SessionsProps> = ({
  sessions,
  onRefresh,
  onOpenAddModal,
  setActiveTab,
  setSelectedSessionId
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [browserNotice, setBrowserNotice] = useState<string | null>(null);

  const handleDelete = async (sessionId: string) => {
    if (!confirm(`Are you sure you want to disconnect and delete session "${sessionId}"?`)) return;
    setDeletingId(sessionId);
    try {
      await api.deleteSession(sessionId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLaunchBrowser = async (sessionId: string) => {
    setLaunchingId(sessionId);
    try {
      const res = await api.launchBrowser(sessionId);
      setBrowserNotice(res.message || 'Chrome window launched on your desktop! Please log in.');
      setTimeout(() => setBrowserNotice(null), 8000);
    } catch (err: any) {
      alert(err.message || 'Failed to launch browser');
    } finally {
      setLaunchingId(null);
    }
  };

  const handleSyncBrowser = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      const res = await api.syncBrowserSession(sessionId);
      if (res.status === 'READY') {
        alert('Session synced successfully! Status: READY 🟢');
      } else {
        alert(res.errorMessage || 'Please log in inside the Chrome browser window first.');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            <span>Connected Instagram Accounts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-account orchestration with OpenWA-style Persistent Browser Profiles & Cookie Jars
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Instagram Account</span>
          </button>
        </div>
      </div>

      {browserNotice && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <Chrome className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{browserNotice}</span>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-2xl bg-[#131b2e] border border-slate-800/90 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl space-y-5 transition-all"
          >
            <div>
              {/* Card Top: Avatar & Status Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-md">
                    <img
                      src={session.profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={session.username}
                      className="w-full h-full object-cover rounded-full bg-slate-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-white">@{session.username}</h3>
                      {session.isVerified && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-slate-400">{session.displayName || session.username}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      ID: {session.id}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  session.status === 'READY'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : session.status === 'TWO_FACTOR_REQUIRED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {session.status}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
                <div>
                  <span className="block text-xs font-bold text-white">{(session.followerCount || 0).toLocaleString()}</span>
                  <span className="block text-[10px] text-slate-400">Followers</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">{(session.followingCount || 0).toLocaleString()}</span>
                  <span className="block text-[10px] text-slate-400">Following</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-white uppercase">{session.authType}</span>
                  <span className="block text-[10px] text-slate-400">Engine Type</span>
                </div>
              </div>

              {/* 1-Click Launch Chrome Profile Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                <button
                  onClick={() => handleLaunchBrowser(session.id)}
                  disabled={launchingId === session.id}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Opens dedicated Chrome profile window on Windows for 1-click human login"
                >
                  <Chrome className="w-3.5 h-3.5 text-blue-400" />
                  <span>Launch Chrome</span>
                </button>
                <button
                  onClick={() => handleSyncBrowser(session.id)}
                  disabled={syncingId === session.id}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Sync session cookies from Chrome profile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === session.id ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setActiveTab('chat');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                  <span>DMs</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setActiveTab('publisher');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-orange-400" />
                  <span>Publish</span>
                </button>
              </div>

              <button
                onClick={() => handleDelete(session.id)}
                disabled={deletingId === session.id}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Disconnect & Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
