import React, { useState } from 'react';
import { BookOpen, Code2, Copy, Check, ExternalLink, Terminal, Sparkles } from 'lucide-react';

export const Docs: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'nodejs'>('python');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const codeSnippets: Record<string, Record<string, string>> = {
    send_dm: {
      python: `import requests

url = "http://localhost:2895/api/v1/sessions/ig_demo_creator/messages/text"
headers = {
    "X-API-Key": "openig_master_sec_2026_dev_key",
    "Content-Type": "application/json"
}
payload = {
    "recipientUsername": "alex_rivers",
    "text": "Hello from OpenIG Python SDK! 🚀"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      nodejs: `import axios from 'axios';

const response = await axios.post(
  'http://localhost:2895/api/v1/sessions/ig_demo_creator/messages/text',
  {
    recipientUsername: 'alex_rivers',
    text: 'Hello from OpenIG Node.js SDK! 🚀'
  },
  {
    headers: {
      'X-API-Key': 'openig_master_sec_2026_dev_key'
    }
  }
);

console.log(response.data);`,
      curl: `curl -X POST http://localhost:2895/api/v1/sessions/ig_demo_creator/messages/text \\
  -H "X-API-Key: openig_master_sec_2026_dev_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientUsername": "alex_rivers",
    "text": "Hello from cURL!"
  }'`
    },
    publish_post: {
      python: `import requests

url = "http://localhost:2895/api/v1/sessions/ig_demo_creator/posts"
headers = {"X-API-Key": "openig_master_sec_2026_dev_key"}
payload = {
    "type": "feed",
    "mediaUrls": ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"],
    "caption": "Automated post from OpenIG API! 🚀 #Tech #OpenSource",
    "hashtags": ["Tech", "OpenSource"]
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`,
      nodejs: `import axios from 'axios';

const res = await axios.post('http://localhost:2895/api/v1/sessions/ig_demo_creator/posts', {
  type: 'feed',
  mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'],
  caption: 'Automated post from OpenIG Node.js! 🚀 #OpenSource'
}, {
  headers: { 'X-API-Key': 'openig_master_sec_2026_dev_key' }
});

console.log(res.data);`,
      curl: `curl -X POST http://localhost:2895/api/v1/sessions/ig_demo_creator/posts \\
  -H "X-API-Key: openig_master_sec_2026_dev_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "feed",
    "mediaUrls": ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"],
    "caption": "Automated post from OpenIG!"
  }'`
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-400" />
            <span>Developer API & SDK Documentation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interact with the gateway programmatically using REST, WebSockets, and SDKs
          </p>
        </div>

        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-400 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
        >
          <span>Open Interactive Swagger UI</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Language Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'python', label: 'Python SDK' },
          { id: 'nodejs', label: 'Node.js / TypeScript' },
          { id: 'curl', label: 'cURL / Shell' }
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeLang === lang.id
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Code Snippet 1: Send DM */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Terminal className="w-4 h-4 text-pink-400" />
            <span>1. Send Direct Message (POST /api/v1/sessions/:id/messages/text)</span>
          </div>
          <button
            onClick={() => copyCode(codeSnippets.send_dm[activeLang], 'dm')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedSection === 'dm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'dm' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-900">
          <code>{codeSnippets.send_dm[activeLang]}</code>
        </pre>
      </div>

      {/* Code Snippet 2: Publish Post */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Terminal className="w-4 h-4 text-pink-400" />
            <span>2. Publish Feed Post (POST /api/v1/sessions/:id/posts)</span>
          </div>
          <button
            onClick={() => copyCode(codeSnippets.publish_post[activeLang], 'post')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedSection === 'post' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'post' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-900">
          <code>{codeSnippets.publish_post[activeLang]}</code>
        </pre>
      </div>
    </div>
  );
};
