import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Image,
  Smile,
  Heart,
  Search,
  Check,
  CheckCheck,
  Sparkles,
  Bot,
  User,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

interface LiveChatProps {
  selectedSessionId: string;
  sessions: any[];
}

export const LiveChat: React.FC<LiveChatProps> = ({ selectedSessionId, sessions }) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // New simulation modal state
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [simSender, setSimSender] = useState('crypto_trader_99');
  const [simText, setSimText] = useState('Hey! Can you send me the LINK and PRICE for your service?');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    if (!selectedSessionId) return;
    try {
      const data = await api.getThreads(selectedSessionId);
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    }
  };

  const fetchMessages = async (threadId: string) => {
    if (!selectedSessionId || !threadId) return;
    setLoading(true);
    try {
      const data = await api.getMessages(selectedSessionId, threadId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [selectedSessionId]);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    }
  }, [activeThreadId, selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() && !mediaUrlInput.trim()) return;
    if (!activeThreadId) return;

    const activeThread = threads.find(t => t.id === activeThreadId);
    const recipient = activeThread?.participants[0]?.username || 'instagram_user';

    setSending(true);
    try {
      if (mediaUrlInput.trim()) {
        await api.sendMediaMessage(selectedSessionId, {
          threadId: activeThreadId,
          recipientUsername: recipient,
          mediaUrl: mediaUrlInput.trim(),
          mediaType: 'image'
        });
        setMediaUrlInput('');
        setShowMediaInput(false);
      }

      if (textInput.trim()) {
        await api.sendTextMessage(selectedSessionId, {
          threadId: activeThreadId,
          recipientUsername: recipient,
          text: textInput.trim()
        });
        setTextInput('');
      }

      await fetchMessages(activeThreadId);
      await fetchThreads();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await api.sendReaction(selectedSessionId, messageId, emoji);
      await fetchMessages(activeThreadId!);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleSimulateIncoming = async () => {
    if (!simText.trim()) return;
    try {
      await api.simulateIncomingMessage(selectedSessionId, {
        senderUsername: simSender,
        text: simText
      });
      setIsSimulateOpen(false);
      await fetchThreads();
      const targetThreadId = `thread_${simSender}`;
      setActiveThreadId(targetThreadId);
      await fetchMessages(targetThreadId);
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const filteredThreads = threads.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.participants?.some((p: any) => p.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Sidebar: Threads List */}
      <div className="w-80 border-r border-slate-800 bg-[#0e1422] flex flex-col shrink-0">
        {/* Search & Actions Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <span>Direct Messages</span>
            </h2>
            <button
              onClick={() => setIsSimulateOpen(true)}
              className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-pink-500/30"
              title="Simulate incoming DM to test automation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test DM</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const participant = thread.participants[0] || { username: thread.title };

              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-all ${
                    isActive
                      ? 'bg-slate-800/80 border-l-4 border-pink-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={participant.profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white truncate">@{participant.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {thread.updatedAt ? new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {thread.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>

                  {thread.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Live Chat Window */}
      {activeThread ? (
        <div className="flex-1 flex flex-col bg-[#0b0f17]">
          {/* Active Header */}
          <div className="h-16 px-6 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-pink-500/30">
                <img
                  src={activeThread.participants[0]?.profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">@{activeThread.participants[0]?.username || activeThread.title}</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Instagram Direct</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSimulateOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Simulate User Message</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.isOutgoing;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-end gap-2 max-w-lg">
                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl text-sm relative shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-xs'
                          : 'bg-[#192237] text-slate-100 border border-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Media Image if present */}
                      {msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden mb-2 max-w-xs border border-white/10">
                          <img src={msg.mediaUrl} alt="" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="absolute -bottom-2.5 right-2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded-full text-xs shadow-md flex items-center gap-1">
                          {msg.reactions.map((r: any, idx: number) => (
                            <span key={idx}>{r.emoji}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Reaction buttons on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 transition-opacity">
                      <button
                        onClick={() => handleReaction(msg.id, '❤️')}
                        className="hover:scale-125 transition-transform text-xs"
                        title="React ❤️"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '🔥')}
                        className="hover:scale-125 transition-transform text-xs"
                        title="React 🔥"
                      >
                        🔥
                      </button>
                    </div>
                  </div>

                  {/* Timestamp & Seen status */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                      msg.status === 'read' ? (
                        <CheckCheck className="w-3 h-3 text-pink-400" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400" />
                      )
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Bar */}
          <div className="px-6 py-1.5 flex items-center gap-3 text-sm bg-[#0e1422]/60 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-medium">Quick Reactions:</span>
            {['❤️', '🔥', '👏', '😂', '🚀', '🙌', '💯'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setTextInput(prev => prev + emoji)}
                className="hover:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Bottom Send Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#0e1422] border-t border-slate-800 space-y-2">
            {showMediaInput && (
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-700">
                <Image className="w-4 h-4 text-pink-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Paste Image URL (https://...)"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none font-mono"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  showMediaInput
                    ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Attach photo/media"
              >
                <Image className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Type a message... (Press Enter to Send)"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-pink-500 transition-colors"
              />

              <button
                type="submit"
                disabled={sending || (!textInput.trim() && !mediaUrlInput.trim())}
                className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 disabled:opacity-50 text-white font-bold shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-white">Select an Instagram Chat</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Choose a thread from the left sidebar or simulate a test message to start chatting in real-time.
          </p>
        </div>
      )}

      {/* Simulate Modal */}
      {isSimulateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-base">
              <Sparkles className="w-5 h-5" />
              <span>Simulate Incoming Instagram DM</span>
            </div>
            <p className="text-xs text-slate-300">
              Injects a mock user message into the gateway. If you have Keyword Auto-Replies configured (e.g. matching "LINK" or "PRICE"), the automation engine will instantly trigger!
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Username</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Text</label>
                <textarea
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSimulateOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateIncoming}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20"
              >
                Send Mock Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
