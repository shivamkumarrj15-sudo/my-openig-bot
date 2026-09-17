import React from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  Send,
  Webhook,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Server,
  Zap,
  Code2
} from 'lucide-react';

interface OverviewProps {
  metrics: any;
  sessions: any[];
  auditLogs: any[];
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenNewPost: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  metrics,
  sessions,
  auditLogs,
  setActiveTab,
  onOpenAddModal,
  onOpenNewPost
}) => {
  const statCards = [
    {
      title: 'Active Accounts',
      value: metrics?.activeSessions ?? sessions.filter(s => s.status === 'READY').length,
      subvalue: `${sessions.length} registered`,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      tab: 'sessions'
    },
    {
      title: 'Messages Today',
      value: metrics?.messagesToday ?? 18,
      subvalue: `${metrics?.totalMessages ?? 48} total DMs`,
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500',
      tab: 'chat'
    },
    {
      title: 'Automation Triggers',
      value: metrics?.totalAutomationTriggers ?? 56,
      subvalue: 'Comment-to-DM active',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      tab: 'automation'
    },
    {
      title: 'Scheduled Posts',
      value: metrics?.scheduledPosts ?? 1,
      subvalue: `${metrics?.totalPosts ?? 8} published`,
      icon: Send,
      color: 'from-purple-500 to-indigo-500',
      tab: 'publisher'
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-pink-950/70 border border-pink-500/20 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span>Self-Hosted Instagram API Gateway</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Scale Instagram Automation Without Limits
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              OpenIG delivers complete REST APIs, real-time WebSockets, Comment-to-DM growth funnels, post scheduling, and multi-account orchestration with zero cloud vendor lock-in.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Add Account</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-pink-400" />
              <span>API Playground</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(card.tab)}
              className="group p-5 rounded-2xl bg-[#131b2e] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-pink-400 flex items-center gap-0.5 transition-colors">
                  <span>View</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{card.subvalue}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Connected Accounts & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Accounts Card */}
        <div className="lg:col-span-2 rounded-2xl bg-[#131b2e] border border-slate-800/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-base text-white">Instagram Accounts</h3>
            </div>
            <button
              onClick={() => setActiveTab('sessions')}
              className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
            >
              Manage all ({sessions.length})
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <img
                      src={session.profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover rounded-full bg-slate-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">@{session.username}</span>
                      {session.isVerified && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {(session.followerCount || 0).toLocaleString()} followers • {session.authType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    session.status === 'READY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : session.status === 'TWO_FACTOR_REQUIRED'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {session.status}
                  </span>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    Open DMs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Activity Log */}
        <div className="rounded-2xl bg-[#131b2e] border border-slate-800/80 p-6 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Live Event Stream</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Real-time</span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-pink-400 uppercase font-semibold">{log.category}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">{log.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No recent activity recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
