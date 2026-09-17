import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Zap,
  Send,
  MessageSquare,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Play,
  Settings,
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Loader2,
  Flame,
  Heart,
  Quote,
  TrendingUp,
  Share2,
  Copy,
  Tag,
  Sparkle
} from 'lucide-react';
import { api } from '../services/api';
import { InstagramPostPreview } from '../components/InstagramPostPreview';

interface AIPilotProps {
  selectedSessionId: string;
  sessions: any[];
}

export const AIPilot: React.FC<AIPilotProps> = ({ selectedSessionId, sessions }) => {
  const [activeSubTab, setActiveSubTab] = useState<'trending_quotes' | 'autopost' | 'autodm' | 'comments' | 'models' | 'logs'>('trending_quotes');
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Trending Quotes State
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [quoteCategory, setQuoteCategory] = useState('life_reality');
  const [quoteTopic, setQuoteTopic] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [generatedQuote, setGeneratedQuote] = useState<any | null>(null);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [publishingQuote, setPublishingQuote] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Live Post Generator State
  const [customTopic, setCustomTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState<any | null>(null);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [publishingAiPost, setPublishingAiPost] = useState(false);

  // DM Tester State
  const [testDmInput, setTestDmInput] = useState('Hey! Can you tell me what the price is and where to buy?');
  const [testDmResult, setTestDmResult] = useState<any | null>(null);
  const [testingDm, setTestingDm] = useState(false);

  // FAQ Editor State
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const fetchConfigAndLogs = async () => {
    try {
      setLoading(true);
      const [cfg, logData] = await Promise.all([
        api.getAIConfig(),
        api.getAILogs(30)
      ]);
      setConfig(cfg);
      setLogs(logData);
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      setLoadingTopics(true);
      const data = await api.getTrendingTopics();
      setTrendingTopics(data);
    } catch (err) {
      console.error('Failed to load trending topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
    fetchTrendingTopics();
  }, []);

  const handleGenerateQuotePreview = async (cat?: string, top?: string) => {
    setGeneratingQuote(true);
    try {
      const activeCat = cat || quoteCategory;
      const activeTop = top !== undefined ? top : quoteTopic;
      const handle = authorHandle || (currentSession?.username ? `@${currentSession.username}` : '@shivamkumar12323229');
      const quote = await api.generateEmotionalQuote({
        category: activeCat,
        topic: activeTop || undefined,
        authorHandle: handle
      });
      setGeneratedQuote(quote);
    } catch (err: any) {
      alert(err.message || 'Failed to generate quote card');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handlePublishQuote = async () => {
    setPublishingQuote(true);
    try {
      const res = await api.publishEmotionalQuote({
        sessionId: selectedSessionId || currentSession?.id,
        category: quoteCategory,
        topic: quoteTopic || undefined
      });
      setGeneratedQuote(res.quote);
      setSuccessMsg(`🚀 Post uploaded live to Instagram (@${currentSession?.username || 'shivamkumar12323229'})!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchConfigAndLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to publish emotional quote to Instagram');
    } finally {
      setPublishingQuote(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateAIConfig(config);
      setConfig(updated);
      setSuccessMsg('AI Auto-Pilot settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePreview = async () => {
    setGeneratingPost(true);
    try {
      const result = await api.generateAIPost(customTopic || undefined);
      setGeneratedPost(result);
    } catch (err: any) {
      alert(err.message || 'Failed to generate post');
    } finally {
      setGeneratingPost(false);
    }
  };

  const handlePublishAiPost = async () => {
    if (!generatedPost || !selectedSessionId) return;
    setPublishingAiPost(true);
    try {
      await api.createPost(selectedSessionId, {
        type: 'feed',
        mediaUrls: [generatedPost.suggestedMediaUrl],
        caption: generatedPost.caption,
        hashtags: generatedPost.hashtags
      });
      setSuccessMsg('AI post successfully published to Instagram!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setGeneratedPost(null);
      await fetchConfigAndLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to publish AI post');
    } finally {
      setPublishingAiPost(false);
    }
  };

  const handleTestDm = async () => {
    setTestingDm(true);
    try {
      const res = await api.generateAIDmReply({
        incomingMessage: testDmInput,
        senderUsername: 'test_user_alex'
      });
      setTestDmResult(res);
    } catch (err: any) {
      alert(err.message || 'DM test failed');
    } finally {
      setTestingDm(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const currentFaqs = config.productFaqs || [];
    setConfig({
      ...config,
      productFaqs: [...currentFaqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]
    });
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    const updated = [...(config.productFaqs || [])];
    updated.splice(index, 1);
    setConfig({ ...config, productFaqs: updated });
  };

  const toggleHour = (hour: number) => {
    const current = config.postingScheduleHours || [];
    const exists = current.includes(hour);
    const updated = exists ? current.filter((h: number) => h !== hour) : [...current, hour].sort((a, b) => a - b);
    setConfig({ ...config, postingScheduleHours: updated });
  };

  if (!config) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-400 mb-2" />
        <span>Loading AI Auto-Pilot Engine...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Master AI Auto-Pilot Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/80 border border-pink-500/30 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>24/7 Autonomous AI Auto-Pilot</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Instagram AI Auto-Pilot Control Center</span>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                config.isEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {config.isEnabled ? 'ACTIVE 🟢' : 'PAUSED ⏸️'}
              </span>
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              OpenIG AI automatically crafts & publishes viral posts on schedule, replies to incoming DMs 24/7 with human jitter, and engages with comments without risking account bans.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => {
                  const updated = { ...config, isEnabled: e.target.checked };
                  setConfig(updated);
                  api.updateAIConfig(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-orange-500 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 w-fit">
        {[
          { id: 'trending_quotes', label: '🔥 Trending Emotional Quotes', icon: Flame },
          { id: 'autopost', label: 'Autonomous Auto-Post', icon: Send },
          { id: 'autodm', label: '24/7 AI DM Chatbot', icon: MessageSquare },
          { id: 'comments', label: 'AI Comment Responder', icon: MessageCircle },
          { id: 'models', label: 'AI Persona & Niche', icon: Sliders },
          { id: 'logs', label: 'Live AI Activity Stream', icon: Bot, badge: logs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: TRENDING EMOTIONAL QUOTES */}
      {activeSubTab === 'trending_quotes' && (
        <div className="space-y-8">
          {/* Header & Quick Intro */}
          <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span>Instagram Trending Topics & Emotional Quote Auto-Publisher</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                AI scans viral Instagram sentiment, writes deep emotional Hindi/Hinglish quotes, designs aesthetic 1080x1080 quote cards with your watermark, and publishes directly to your account.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
                <span>@{currentSession?.username || 'shivamkumar12323229'}</span>
              </span>
              <button
                onClick={fetchTrendingTopics}
                disabled={loadingTopics}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTopics ? 'animate-spin' : ''}`} />
                <span>Refresh Trends</span>
              </button>
            </div>
          </div>

          {/* Trending Topics Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                <span>Real-Time Trending Themes on Instagram</span>
              </h4>
              <span className="text-[11px] text-slate-500">Click any card to instant-generate quote</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {trendingTopics.map((topic) => {
                const isSelected = quoteCategory === topic.category;
                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      setQuoteCategory(topic.category);
                      setQuoteTopic(topic.title);
                      handleGenerateQuotePreview(topic.category, topic.title);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-gradient-to-b from-pink-950/40 to-slate-900 border-pink-500/60 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/40'
                        : 'bg-[#131b2e] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30 flex items-center gap-1">
                          🔥 {topic.trendingScore}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{topic.categoryName}</span>
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-2">{topic.title}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-pink-400 font-mono font-medium">{topic.badgeTag}</span>
                      <span className="text-[11px] text-slate-400 hover:text-white font-bold flex items-center gap-1">
                        Use <Sparkles className="w-3 h-3 text-pink-400" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generator Form & Live Visual Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Configuration */}
            <div className="lg:col-span-6 bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <Quote className="w-4 h-4 text-pink-400" />
                  <span>Customize Quote & Publishing Settings</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a mood or enter custom topic keywords, then preview or publish directly.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Emotional Theme / Mood
                  </label>
                  <select
                    value={quoteCategory}
                    onChange={(e) => setQuoteCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white cursor-pointer focus:outline-none focus:border-pink-500"
                  >
                    <option value="life_reality">🥀 ज़िन्दगी की कड़वी सच्चाई (Life Reality & Lessons)</option>
                    <option value="time_trust">⏳ वक्त, भरोसा और सब्र (Time, Patience & Trust)</option>
                    <option value="silent_hustle">🔥 खामोश मेहनत और अकेले चलना (Silent Hustle)</option>
                    <option value="heartbreak_healing">💔 दर्द, तन्हाई और हीलिंग (Heartbreak & Deep Healing)</option>
                    <option value="mindset_psychology">🧠 मजबूत सोच और आत्मसम्मान (Mindset & Self-Respect)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Custom Topic / Keyword Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={quoteTopic}
                    onChange={(e) => setQuoteTopic(e.target.value)}
                    placeholder="e.g. बुरे वक्त में साथ छोड़ना, सब्र का फल, सफलता का राज..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Author Watermark Handle (Displayed on Quote Card)
                  </label>
                  <input
                    type="text"
                    value={authorHandle || (currentSession?.username ? `@${currentSession.username}` : '@shivamkumar12323229')}
                    onChange={(e) => setAuthorHandle(e.target.value)}
                    placeholder="@your_instagram_handle"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateQuotePreview()}
                  disabled={generatingQuote}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  {generatingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                      <span>Designing Quote Card...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span>Generate & Preview Card</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePublishQuote}
                  disabled={publishingQuote}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                >
                  {publishingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Posting to Instagram...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>🚀 1-Click Post Live to Instagram</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Uses Chromium automation to publish directly to Instagram without third-party API restrictions or watermarks.
                </span>
              </div>
            </div>

            {/* Right Column: Live Card & Caption Preview */}
            <div className="lg:col-span-6 space-y-6">
              {generatedQuote ? (
                <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <h4 className="font-bold text-base text-white">
                        4K Ultra HD Quote Card & Critic Review
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/40">
                        4K UHD (2160x2160)
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                        {generatedQuote.badgeTag}
                      </span>
                    </div>
                  </div>

                  {/* AI Critic Quality Scorecard */}
                  {generatedQuote.criticScore && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-pink-950/40 border border-amber-500/30 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⭐</span>
                          <div>
                            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                              AI Critic Quality Score
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-lg font-extrabold text-white">
                                {generatedQuote.criticScore.overallRating}
                                <span className="text-xs text-amber-400">/100</span>
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {generatedQuote.criticScore.grade}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Critic Verified 100%</span>
                        </span>
                      </div>

                      {/* Score Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Emotional Depth</span>
                          <span className="text-xs font-bold text-pink-300">{generatedQuote.criticScore.emotionalDepth}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Heart Touch</span>
                          <span className="text-xs font-bold text-rose-300">{generatedQuote.criticScore.heartTouchResonance}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Virality Index</span>
                          <span className="text-xs font-bold text-orange-300">{generatedQuote.criticScore.viralityShareability}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Poetic Flow</span>
                          <span className="text-xs font-bold text-purple-300">{generatedQuote.criticScore.poeticFlow}%</span>
                        </div>
                      </div>

                      {/* In-depth Critic Review */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed font-medium">
                        {generatedQuote.criticScore.criticReview}
                      </div>
                    </div>
                  )}

                  {/* Rendered 4K Quote Card Image */}
                  <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-black aspect-square max-w-[420px] mx-auto group">
                    <img
                      src={generatedQuote.cardImageUrl}
                      alt="4K Aesthetic Emotional Quote Card"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-cyan-300 text-[10px] font-black border border-cyan-500/40 shadow-lg">
                      4K ULTRA HD
                    </div>
                  </div>

                  {/* Full Instagram Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Instagram Caption & Hashtags
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${generatedQuote.caption}\n\n${generatedQuote.hashtags.map((h: string) => `#${h}`).join(' ')}`);
                          setCopiedCaption(true);
                          setTimeout(() => setCopiedCaption(false), 2000);
                        }}
                        className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold"
                      >
                        {copiedCaption ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {generatedQuote.caption}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {generatedQuote.hashtags.map((tag: string) => (
                        <span key={tag} className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#131b2e] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto shadow-inner">
                    <Quote className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">No 4K Quote Card Generated Yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Select one of the trending themes above or click "Generate & Preview Card" to render a 4K Ultra HD AI Critic Masterpiece.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateQuotePreview()}
                    disabled={generatingQuote}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold shadow-md hover:opacity-90 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    {generatingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate Instant 4K Quote</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: AUTONOMOUS AUTO-POST */}
      {activeSubTab === 'autopost' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls: 7 cols */}
          <div className="lg:col-span-7 bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-pink-400" />
                  <span>Autonomous Daily Content Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI generates engaging captions, hooks, hashtags, and selects visuals to publish automatically
                </p>
              </div>

              <input
                type="checkbox"
                checked={config.autoPostEnabled}
                onChange={(e) => setConfig({ ...config, autoPostEnabled: e.target.checked })}
                className="w-5 h-5 accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Posting Schedule Times */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Daily Posting Schedule (Hours of Day)</span>
              </label>
              <div className="grid grid-cols-6 gap-2 text-xs">
                {[8, 10, 12, 14, 16, 18, 20, 21, 22].map((hour) => {
                  const isSelected = (config.postingScheduleHours || []).includes(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleHour(hour)}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all ${
                        isSelected
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {hour}:00
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Instant Post Generator */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Instant AI Post Generator</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter custom topic or leave blank for automatic niche idea..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
                <button
                  onClick={handleGeneratePreview}
                  disabled={generatingPost}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  {generatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Auto-Post Settings'}
              </button>
            </div>
          </div>

          {/* Right Phone Mockup Preview: 5 cols */}
          <div className="lg:col-span-5 flex flex-col items-center sticky top-6 space-y-4">
            <InstagramPostPreview
              type="feed"
              username={currentSession?.username || 'brand_official'}
              profilePicUrl={currentSession?.profilePicUrl}
              mediaUrls={[generatedPost?.suggestedMediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80']}
              caption={generatedPost?.caption || '🚀 Click "Generate" on the left to see the live AI generated post preview here!'}
              hashtags={generatedPost?.hashtags || ['AIAutomation', 'InstagramGrowth', 'Tech']}
            />

            {generatedPost && (
              <button
                onClick={handlePublishAiPost}
                disabled={publishingAiPost}
                className="w-[320px] py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {publishingAiPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Publish This AI Post Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 24/7 AI DM CHATBOT */}
      {activeSubTab === 'autodm' && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <span>24/7 Autonomous AI DM Conversational Agent</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically understands incoming DMs, answers customer inquiries, and delivers lead capture links
              </p>
            </div>

            <input
              type="checkbox"
              checked={config.autoDmReplyEnabled}
              onChange={(e) => setConfig({ ...config, autoDmReplyEnabled: e.target.checked })}
              className="w-5 h-5 accent-pink-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Knowledge Base FAQs */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Product Knowledge Base & FAQs ({config.productFaqs?.length || 0})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(config.productFaqs || []).map((faq: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-400">Q: {faq.question}</span>
                      <button
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">A: {faq.answer}</p>
                  </div>
                ))}
              </div>

              {/* Add FAQ form */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Question (e.g. What is the pricing or discount code?)"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Answer with direct link/details..."
                  value={newFaqA}
                  onChange={(e) => setNewFaqA(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ to AI</span>
                </button>
              </div>
            </div>

            {/* Lead Capture Link & Live DM Tester */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Lead Capture / Purchase Destination URL
                </label>
                <input
                  type="url"
                  value={config.leadCaptureUrl || ''}
                  onChange={(e) => setConfig({ ...config, leadCaptureUrl: e.target.value })}
                  placeholder="https://mywebsite.com/vip-access"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              {/* Interactive DM Test Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  <span>Test AI DM Response Live</span>
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={testDmInput}
                    onChange={(e) => setTestDmInput(e.target.value)}
                    placeholder="Type an incoming customer message..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <button
                    onClick={handleTestDm}
                    disabled={testingDm}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    {testingDm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>Test AI Response</span>
                  </button>
                </div>

                {testDmResult && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <span className="font-bold text-emerald-400 block text-[11px]">AI Generated Reply:</span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{testDmResult.replyText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save AI DM Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: COMMENTS RESPONDER */}
      {activeSubTab === 'comments' && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-pink-400" />
                <span>AI Comment Sentiment Responder & Lead Funnel</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Engages positively on fan comments and sends instant private DMs when users ask about prices or links
              </p>
            </div>

            <input
              type="checkbox"
              checked={config.autoCommentReplyEnabled}
              onChange={(e) => setConfig({ ...config, autoCommentReplyEnabled: e.target.checked })}
              className="w-5 h-5 accent-pink-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">1. Positive & Fan Comments</span>
              <p className="text-slate-300 leading-relaxed text-xs">
                When users comment "Love this! 🔥", "Amazing content", or similar praises, AI crafts warm, personalized thank-you replies to boost Instagram algorithm reach.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-pink-400 block text-sm">2. Buying Intent / Link Inquiries</span>
              <p className="text-slate-300 leading-relaxed text-xs">
                When users comment "Price?", "Where to buy?", or "Link please", AI replies publicly ("Sent to your DM! 📩") and immediately sends them your private access link via DM.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONA & NICHE */}
      {activeSubTab === 'models' && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-4">
            <Sliders className="w-4 h-4 text-pink-400" />
            <span>AI Persona, Niche & Provider Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Account Niche / Industry
              </label>
              <input
                type="text"
                value={config.niche}
                onChange={(e) => setConfig({ ...config, niche: e.target.value })}
                placeholder="e.g. AI & Tech, Fitness, Digital Marketing, Fashion"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Brand Tone of Voice
              </label>
              <select
                value={config.brandTone}
                onChange={(e) => setConfig({ ...config, brandTone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white cursor-pointer"
              >
                <option value="Friendly & Engaging">Friendly & Engaging</option>
                <option value="Professional & Authoritative">Professional & Authoritative</option>
                <option value="Casual & Humorous">Casual & Humorous</option>
                <option value="Luxury & Minimalist">Luxury & Minimalist</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Custom System Instructions / Persona Prompt
              </label>
              <textarea
                rows={3}
                value={config.customInstructions}
                onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                placeholder="Instructions on how AI should speak, behave, and represent your brand..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                LLM Provider
              </label>
              <select
                value={config.llmProvider}
                onChange={(e) => setConfig({ ...config, llmProvider: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white cursor-pointer"
              >
                <option value="local_heuristic">Built-in AI Engine (Free & Zero API Key Required)</option>
                <option value="gemini">Google Gemini API (Gemini 1.5 Flash)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-3.5)</option>
              </select>
            </div>

            {config.llmProvider === 'gemini' && (
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={config.geminiApiKey || ''}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save Persona Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE AI ACTIVITY LOG */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Autonomous AI Activity Feed</span>
            </h3>
            <button
              onClick={fetchConfigAndLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className={`font-mono font-bold uppercase ${
                      log.type === 'auto_post' ? 'text-pink-400' : log.type === 'lead_captured' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{log.summary}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No autonomous AI activity recorded yet. Turn on Auto-Pilot above!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
