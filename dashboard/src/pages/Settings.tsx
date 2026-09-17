import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, Shield, Globe, HardDrive, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [port, setPort] = useState('2895');
  const [defaultProxy, setDefaultProxy] = useState('');
  const [enableSandbox, setEnableSandbox] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-pink-400" />
          <span>System & Gateway Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure network ports, proxy rotation, and storage persistence
        </p>
      </div>

      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {saved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Server Config */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Server className="w-4 h-4 text-pink-400" />
              <span>Gateway Engine Configuration</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">HTTP / REST Port</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Proxy Tunnel</label>
                <input
                  type="text"
                  value={defaultProxy}
                  onChange={(e) => setDefaultProxy(e.target.value)}
                  placeholder="http://proxy:8080"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Enable Sandbox Demo Driver</span>
                <span className="text-[11px] text-slate-400 block">Allows safe local testing and development with simulated accounts</span>
              </div>
              <input
                type="checkbox"
                checked={enableSandbox}
                onChange={(e) => setEnableSandbox(e.target.checked)}
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold shadow-md cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
