import React, { useState } from 'react';
import { X, Key, Shield, Globe, Sparkles, Check, AlertCircle, Loader2, Copy, HelpCircle, ExternalLink, Cookie } from 'lucide-react';
import { api } from '../services/api';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (session: any) => void;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({ isOpen, onClose, onSessionCreated }) => {
  const [authMethod, setAuthMethod] = useState<'credentials' | 'cookies' | 'bookmarklet' | 'demo'>('cookies');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionIdCookie, setSessionIdCookie] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [dsUserId, setDsUserId] = useState('');
  const [proxy, setProxy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // 2FA challenge state
  const [is2faStep, setIs2faStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:(function(){
  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
  const sessionid = getCookie("sessionid");
  const ds_user_id = getCookie("ds_user_id");
  const csrftoken = getCookie("csrftoken");
  if (!sessionid) {
    alert("Please log into instagram.com first!");
    return;
  }
  const data = JSON.stringify({ sessionid, ds_user_id, csrftoken });
  navigator.clipboard.writeText(data);
  alert("Instagram Session Copied to Clipboard! Now paste it into OpenIG Cookie Jar.");
})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePasteJson = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed.sessionid) setSessionIdCookie(parsed.sessionid);
      if (parsed.ds_user_id) setDsUserId(parsed.ds_user_id);
      if (parsed.csrftoken) setCsrfToken(parsed.csrftoken);
    } catch {
      // not json, normal input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (is2faStep && createdSessionId) {
        const res = await api.submit2FA(createdSessionId, twoFactorCode);
        if (res.status === 'READY' || res.success) {
          onSessionCreated(res);
          onClose();
        } else {
          setError(res.errorMessage || 'Invalid 2FA code. Please retry.');
        }
        setLoading(false);
        return;
      }

      let payload: any = { proxy: proxy || undefined };

      if (authMethod === 'credentials') {
        if (!username) {
          setError('Instagram username is required');
          setLoading(false);
          return;
        }
        payload.username = username;
        payload.password = password;
      } else if (authMethod === 'cookies') {
        if (!sessionIdCookie) {
          setError('sessionid cookie is required');
          setLoading(false);
          return;
        }
        payload.username = username || (dsUserId ? `user_${dsUserId}` : 'ig_account');
        payload.cookies = {
          sessionid: sessionIdCookie,
          csrftoken: csrfToken,
          ds_user_id: dsUserId
        };
      } else if (authMethod === 'demo') {
        payload.username = `demo_brand_${Math.floor(Math.random() * 900) + 100}`;
        payload.password = 'demo';
      }

      const res = await api.createSession(payload);

      if (res.authResult?.challengeRequired || res.authResult?.status === 'TWO_FACTOR_REQUIRED') {
        setIs2faStep(true);
        setCreatedSessionId(res.session.id);
        setError(res.authResult?.errorMessage || 'Instagram requires 2FA or security code verification.');
      } else if (res.authResult?.status === 'ERROR') {
        setError(res.authResult?.errorMessage || 'Failed to connect. Please check credentials or use Cookie Jar method.');
      } else {
        onSessionCreated(res.session);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-[#131b2e] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#0e1422] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center shadow-md">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Connect Instagram Account</h3>
              <p className="text-xs text-slate-400">100% Working Dual Engine (Cookie Jar & Web Automation)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-red-200">Connection Notice</span>
                <span className="leading-relaxed block">{error}</span>
              </div>
            </div>
          )}

          {!is2faStep ? (
            <>
              {/* Method Selector */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMethod('cookies')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    authMethod === 'cookies'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Cookie Jar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('credentials')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${
                    authMethod === 'credentials'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('bookmarklet')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${
                    authMethod === 'bookmarklet'
                      ? 'bg-slate-800 text-pink-400 shadow-sm border border-pink-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1-Click Helper
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('demo')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    authMethod === 'demo'
                      ? 'bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-400 border border-pink-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sandbox</span>
                </button>
              </div>

              {/* Cookie Jar Option (Recommended, 100% Reliable) */}
              {authMethod === 'cookies' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                      <Shield className="w-4 h-4" />
                      <span>Recommended: 100% Safe & Guaranteed Connection</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Instagram blocks suspicious direct password attempts. Using your active session cookie bypasses all security checkpoints instantly!
                    </p>
                    <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono">
                      <div>1. Open <b>instagram.com</b> in Chrome/Edge & log in.</div>
                      <div>2. Press <b>F12</b> &rarr; <b>Application</b> &rarr; <b>Cookies</b> &rarr; <b>instagram.com</b></div>
                      <div>3. Copy <b>sessionid</b> and paste below.</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Username (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. my_official_brand"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-1">
                      sessionid Cookie (Required) *
                    </label>
                    <input
                      type="text"
                      placeholder="63284920%3Abcxyz... (Paste sessionid here)"
                      value={sessionIdCookie}
                      onChange={(e) => setSessionIdCookie(e.target.value.trim())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ds_user_id (User ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. 63284920"
                        value={dsUserId}
                        onChange={(e) => setDsUserId(e.target.value.trim())}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">csrftoken</label>
                      <input
                        type="text"
                        placeholder="e.g. xyz123"
                        value={csrfToken}
                        onChange={(e) => setCsrfToken(e.target.value.trim())}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Login Option */}
              {authMethod === 'credentials' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs leading-relaxed">
                    Automated Web Driver will log in. If your account has 2FA enabled, you will be prompted for the code in the next step.
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Instagram Username</label>
                    <input
                      type="text"
                      placeholder="e.g. my_official_account"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 1-Click Bookmarklet Extractor */}
              {authMethod === 'bookmarklet' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-slate-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-pink-400">
                      <Sparkles className="w-4 h-4" />
                      <span>1-Click Session Grabber Snippet</span>
                    </div>
                    <p>
                      Copy this snippet, open Chrome/Edge DevTools (F12) Console on <b>instagram.com</b>, and hit Enter. It will copy your session cookies to clipboard!
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-mono text-slate-400 truncate max-w-xs">javascript:(function()...</span>
                    <button
                      type="button"
                      onClick={handleCopyBookmarklet}
                      className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied Snippet!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Paste Copied Session JSON here:
                    </label>
                    <textarea
                      rows={3}
                      onChange={handlePasteJson}
                      placeholder='{"sessionid":"...","ds_user_id":"..."}'
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}

              {/* Sandbox Demo Option */}
              {authMethod === 'demo' && (
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-slate-300 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-pink-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Instant Sandbox Demo Account</span>
                  </div>
                  <p>
                    Instantly creates a sandbox simulated account with preloaded messages, followers, and Comment-to-DM triggers for safe local development.
                  </p>
                </div>
              )}

              {/* Optional Proxy Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Proxy Tunnel (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">HTTP / SOCKS5</span>
                </label>
                <input
                  type="text"
                  placeholder="http://user:pass@proxy.example.com:8080"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-pink-500"
                />
              </div>
            </>
          ) : (
            /* 2FA Security Code Prompt */
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-500/40 mx-auto flex items-center justify-center text-pink-400 shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Two-Factor Authentication</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  Instagram sent a 6-digit security code to your phone/authenticator app. Enter it below to complete verification:
                </p>
              </div>
              <input
                type="text"
                maxLength={8}
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-48 mx-auto text-center tracking-widest text-xl font-extrabold font-mono px-4 py-3 rounded-2xl bg-slate-900 border-2 border-pink-500 text-white focus:outline-none focus:ring-4 focus:ring-pink-500/30"
                required
              />
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : is2faStep ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verify 2FA Code</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Connect to Instagram</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
