import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Sparkles,
  Send,
  MessageCircle,
  Webhook,
  Key,
  BookOpen,
  Settings,
  Radio,
  ExternalLink,
  Bot
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSessionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, activeSessionsCount }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'aipilot', label: 'AI Auto-Pilot 24/7', icon: Bot, highlightAi: true },
    { id: 'sessions', label: 'Accounts', icon: Users, badge: activeSessionsCount },
    { id: 'chat', label: 'Direct Messages', icon: MessageSquare },
    { id: 'publisher', label: 'Post & Story Studio', icon: Send },
    { id: 'automation', label: 'Comment-to-DM & Bot', icon: Sparkles },
    { id: 'comments', label: 'Comment Hub', icon: MessageCircle },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'apikeys', label: 'API Keys', icon: Key },
    { id: 'docs', label: 'API Playground', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0e1422] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg shadow-pink-500/20">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-white tracking-tight">OpenIG</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">v1.0</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Instagram API Gateway</p>
        </div>
      </div>

      {/* Gateway Live Status Indicator */}
      <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400">Gateway Active</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Port 2895</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">
          AI & Management
        </div>
        {menuItems.slice(0, 7).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/15 text-white border border-pink-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : item.highlightAi ? 'text-pink-400 animate-pulse' : 'text-slate-400'}`} />
                <span className={item.highlightAi && !isActive ? 'text-slate-200 font-semibold' : ''}>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
              {item.highlightAi && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-xs">
                  AI
                </span>
              )}
            </button>
          );
        })}

        <div className="text-[11px] font-semibold text-slate-400 px-3 pt-4 pb-1 uppercase tracking-wider">
          Developer & System
        </div>
        {menuItems.slice(7).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/10 text-white border border-pink-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#090d16]">
        <div className="flex items-center justify-between">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-pink-400 flex items-center gap-1 transition-colors"
          >
            <span>Swagger Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-[11px] text-slate-400 font-mono">OpenWA-Engine</span>
        </div>
      </div>
    </aside>
  );
};
