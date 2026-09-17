import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Play, CheckCircle2, AlertCircle, Shield, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

export const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('message.received, comment.created, follower.new');
  const [secret, setSecret] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const data = await api.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventList = events.split(',').map(e => e.trim()).filter(Boolean);
      await api.createWebhook({
        name,
        url,
        events: eventList,
        secret: secret || undefined
      });
      setIsModalOpen(false);
      setName('');
      setUrl('');
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.message || 'Failed to create webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await api.deleteWebhook(id);
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestingId(webhookId);
    setTestResult(null);
    try {
      const res = await api.testWebhook(webhookId);
      setTestResult({ webhookId, ...res });
      await fetchWebhooks();
    } catch (err: any) {
      setTestResult({ webhookId, success: false, errorMessage: err.message });
    } finally {
      setTestingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Webhook className="w-5 h-5 text-pink-400" />
            <span>Webhooks & Event Streams</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Receive real-time signed HTTP POST payloads for incoming DMs, comments, and mentions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {/* Webhooks Table */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {webhooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3 px-4">Webhook Name & URL</th>
                  <th className="py-3 px-4">Subscribed Events</th>
                  <th className="py-3 px-4">HMAC Secret</th>
                  <th className="py-3 px-4">Deliveries</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {webhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 space-y-1">
                      <span className="font-bold text-white block text-sm">{wh.name}</span>
                      <span className="font-mono text-[11px] text-pink-400 block truncate max-w-sm">{wh.url}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((e: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="truncate max-w-[120px]">{wh.secret}</span>
                        <button
                          onClick={() => copyToClipboard(wh.secret, wh.id)}
                          className="hover:text-white"
                          title="Copy Secret"
                        >
                          {copiedId === wh.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-emerald-400 font-bold">{wh.successfulDeliveries || 0} passed</span>
                        <span className="text-slate-500 block text-[10px]">{wh.failedDeliveries || 0} failed</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTest(wh.id)}
                          disabled={testingId === wh.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>{testingId === wh.id ? 'Sending...' : 'Test'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No webhooks configured yet
          </div>
        )}
      </div>

      {/* Test Result Inspector Banner */}
      {testResult && (
        <div className={`p-4 rounded-2xl border ${
          testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        } text-xs space-y-1 shadow-lg`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>Webhook Test Result: {testResult.success ? `Delivered (Status: ${testResult.statusCode})` : 'Delivery Failed'}</span>
            {testResult.responseTimeMs && <span className="text-[10px] font-mono ml-auto">{testResult.responseTimeMs}ms</span>}
          </div>
          {testResult.errorMessage && <p className="text-xs text-red-400">{testResult.errorMessage}</p>}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-pink-400" />
              <span>Register Webhook Destination</span>
            </h3>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Friendly Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My CRM Backend Webhook"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://my-domain.com/webhooks/instagram"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subscribed Events (Comma-separated)</label>
                <input
                  type="text"
                  value={events}
                  onChange={(e) => setEvents(e.target.value)}
                  placeholder="message.received, comment.created, follower.new"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-pink-400 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">HMAC Secret Key (Optional - auto-generated if blank)</label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
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
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
