import React from 'react';
import { Plus, Send, Radio, User, ChevronDown, CheckCircle2, Bot } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  sessions: any[];
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenNewPost: () => void;
  isWsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  sessions,
  selectedSessionId,
  setSelectedSessionId,
  onOpenAddModal,
  onOpenNewPost,
  isWsConnected
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Dashboard Overview', subtitle: 'Live gateway metrics, active sessions, and throughput' },
    aipilot: { title: '24/7 AI Auto-Pilot', subtitle: 'Autonomous AI post generator, 24/7 DM chatbot, and comment responder' },
    sessions: { title: 'Instagram Accounts', subtitle: 'Multi-account persistent browser sessions, credentials, and proxies' },
    chat: { title: 'Direct Messages', subtitle: 'Live chat console, incoming threads, and media messaging' },
    publisher: { title: 'Post & Story Studio', subtitle: 'Publish or schedule Feed Posts, Carousels, Reels, and Stories' },
    automation: { title: 'Comment-to-DM & Automation', subtitle: 'Growth funnels, keyword auto-replies, and welcome triggers' },
    comments: { title: 'Comment Hub & Moderation', subtitle: 'Monitor, auto-reply, and moderate Instagram comments' },
    webhooks: { title: 'Webhooks & Event Stream', subtitle: 'HMAC-signed webhook subscriptions and live delivery tester' },
    apikeys: { title: 'API Key Management', subtitle: 'Role-based access tokens for REST API integration' },
    docs: { title: 'API Playground & Docs', subtitle: 'Test live endpoints and view SDK code examples' },
    settings: { title: 'Gateway Settings', subtitle: 'System configuration, proxy pools, and backups' },
  };

  const currentInfo = titles[activeTab] || { title: 'OpenIG Gateway', subtitle: 'Self-hosted Instagram API Gateway' };
  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0e1422]/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-slate-400">{currentInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Account Switcher */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-pink-500/40">
              {currentSession?.profilePicUrl ? (
                <img src={currentSession.profilePicUrl} alt={currentSession.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-2"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  @{s.username} {s.status === 'READY' ? '🟢' : '🟡'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Real-time Socket status badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          isWsConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          <Radio className={`w-3.5 h-3.5 ${isWsConnected ? 'animate-pulse' : ''}`} />
          <span>{isWsConnected ? 'Live WS' : 'Connecting'}</span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onOpenNewPost}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-pink-400" />
          <span>New Post</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Account</span>
        </button>
      </div>
    </header>
  );
};
