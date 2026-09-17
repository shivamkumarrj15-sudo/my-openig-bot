import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Zap,
  MessageCircle,
  MessageSquare,
  UserPlus,
  Bot,
  Play,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

interface AutomationProps {
  selectedSessionId: string;
  sessions: any[];
}

export const Automation: React.FC<AutomationProps> = ({ selectedSessionId, sessions }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState('Comment "BUY" -> Instant DM & Coupon');
  const [ruleType, setRuleType] = useState<'comment_to_dm' | 'keyword_auto_reply' | 'welcome_dm'>('comment_to_dm');
  const [keywords, setKeywords] = useState('PRICE, BUY, LINK, DM, INFO');
  const [likeComment, setLikeComment] = useState(true);
  const [publicReply, setPublicReply] = useState('Sent to your DM! 📩 Check your inbox @{username}');
  const [dmTemplate, setDmTemplate] = useState('Hey @{username}! 🚀 Here is your direct link & 20% discount code: https://openig.dev/deal-20\n\nLet us know if you have any questions!');

  // Test Runner State
  const [testComment, setTestComment] = useState('Hey! Can you send me the price and link?');
  const [testUsername, setTestUsername] = useState('sarah_fashion');
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchRules = async () => {
    try {
      const data = await api.getAutomations(selectedSessionId);
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch automations:', err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [selectedSessionId]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      await api.createAutomation({
        sessionId: selectedSessionId || undefined,
        name: ruleName,
        type: ruleType,
        triggerKeywords: keywordList,
        matchType: 'contains',
        actionLikeComment: likeComment,
        actionPublicReplyTemplate: publicReply,
        actionDmMessageTemplate: dmTemplate
      });
      setIsModalOpen(false);
      await fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to create automation');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await api.deleteAutomation(ruleId);
      await fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleTestTrigger = async () => {
    try {
      const res = await api.simulateIncomingComment(selectedSessionId, {
        authorUsername: testUsername,
        text: testComment
      });
      setTestResult(res);
      await fetchRules();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Growth Funnels & DM Automation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn post comments into leads, trigger automated DMs on keywords, and welcome new followers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTestOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Rules Live</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation Rule</span>
          </button>
        </div>
      </div>

      {/* Feature Showcase Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#131b2e] border border-pink-500/20 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
            <MessageCircle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Comment-to-DM Funnel</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detect trigger keywords like "PRICE" in comments $\rightarrow$ Auto-like $\rightarrow$ Public reply $\rightarrow$ Send direct link DM.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131b2e] border border-purple-500/20 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Keyword Auto-Responder</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instantly answers customer inquiries in DMs 24/7 with customized rich message templates.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131b2e] border border-orange-500/20 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <UserPlus className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Welcome New Followers</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically greets new followers with a warm introductory message and resource links.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-pink-400" />
          <span>Active Automation Rules ({rules.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Trigger Keywords</th>
                <th className="py-3 px-4">DM Action Template</th>
                <th className="py-3 px-4">Executions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{rule.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-pink-400 uppercase">
                    {rule.type.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {rule.triggerKeywords?.map((k: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                          {k}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-400">
                    {rule.actionDmMessageTemplate}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{rule.executionsCount || 0}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Create Growth Automation Rule</span>
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Automation Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                >
                  <option value="comment_to_dm">Comment-to-DM Growth Funnel</option>
                  <option value="keyword_auto_reply">Keyword DM Auto-Responder</option>
                  <option value="welcome_dm">Welcome New Follower Greeting</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Trigger Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="PRICE, LINK, BUY, INFO"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-pink-400 text-xs font-mono font-bold"
                />
              </div>

              {ruleType === 'comment_to_dm' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Public Comment Reply Template
                  </label>
                  <input
                    type="text"
                    value={publicReply}
                    onChange={(e) => setPublicReply(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Variables: @&#123;username&#125;, &#123;postId&#125;</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Private DM Message Template (Sent to user)
                </label>
                <textarea
                  rows={3}
                  value={dmTemplate}
                  onChange={(e) => setDmTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold shadow-md"
                >
                  Save Automation Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Rule Live Modal */}
      {isTestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Simulate Comment Trigger</span>
            </h3>
            <p className="text-xs text-slate-300">
              Submit a sample user comment on your post and watch the Comment-to-DM engine trigger live!
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Commenter Username</label>
                <input
                  type="text"
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comment Text</label>
                <textarea
                  rows={2}
                  value={testComment}
                  onChange={(e) => setTestComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rule Triggered Successfully!</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Executed: {testResult.automationResult?.ruleNames?.join(', ') || 'Rule matched'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setIsTestOpen(false); setTestResult(null); }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={handleTestTrigger}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md"
              >
                Trigger Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
