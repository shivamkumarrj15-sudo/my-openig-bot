import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, ShieldCheck, Lock } from 'lucide-react';
import { api } from '../services/api';

export const ApiKeys: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [role, setRole] = useState<'admin' | 'operator' | 'read_only'>('operator');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createApiKey({ name: keyName, role });
      setIsModalOpen(false);
      setKeyName('');
      await fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to create key');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await api.deleteApiKey(id);
      await fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
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
            <Key className="w-5 h-5 text-pink-400" />
            <span>API Key & Token Security</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authentication credentials for external applications, SDKs, and automation scripts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Role / Scope</th>
                <th className="py-3 px-4">API Key Token</th>
                <th className="py-3 px-4">Requests Handled</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-pink-400" />
                    <span>{k.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      k.role === 'admin'
                        ? 'bg-red-500/20 text-red-400'
                        : k.role === 'operator'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {k.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span>{k.key}</span>
                      <button
                        onClick={() => copyToClipboard(k.rawKey || k.key, k.id)}
                        className="p-1 hover:text-white"
                        title="Copy Key"
                      >
                        {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-200">{k.requestsCount || 0} reqs</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Revoke Key"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-pink-400" />
              <span>Create New API Key</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Key Description</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Python Microservice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Permission</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white cursor-pointer"
                >
                  <option value="operator">Operator (Send DMs, Publish Posts, Comments)</option>
                  <option value="admin">Admin (Full Access + Session & Key Management)</option>
                  <option value="read_only">Read-Only (Analytics & Logs Only)</option>
                </select>
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
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
