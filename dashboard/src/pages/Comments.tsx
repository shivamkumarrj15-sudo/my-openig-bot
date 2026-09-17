import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Sparkles, Check, CornerDownRight } from 'lucide-react';
import { api } from '../services/api';

interface CommentsProps {
  selectedSessionId: string;
  sessions: any[];
}

export const Comments: React.FC<CommentsProps> = ({ selectedSessionId, sessions }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await api.getComments(selectedSessionId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [selectedSessionId]);

  const handleReply = async (commentId: string) => {
    const text = replyInput[commentId];
    if (!text || !text.trim()) return;

    try {
      await api.replyComment(selectedSessionId, commentId, text.trim());
      setReplyInput(prev => ({ ...prev, [commentId]: '' }));
      await fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to reply');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(selectedSessionId, commentId);
      await fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
            <span>Comments & Engagement Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor incoming post comments, trigger instant replies, and auto-moderate sentiment
          </p>
        </div>
      </div>

      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {comments.length > 0 ? (
          <div className="space-y-4 divide-y divide-slate-800/80">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                      <img
                        src={comment.authorPicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">@{comment.authorUsername}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          comment.sentiment === 'positive'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : comment.sentiment === 'question'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {comment.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 font-medium">{comment.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Replied state or Inline Reply Box */}
                {comment.replied && comment.replyText ? (
                  <div className="ml-12 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2 text-xs">
                    <CornerDownRight className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-pink-400 block text-[11px]">Your Reply:</span>
                      <p className="text-slate-200">{comment.replyText}</p>
                    </div>
                  </div>
                ) : (
                  <div className="ml-12 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Reply to @${comment.authorUsername}...`}
                      value={replyInput[comment.id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [comment.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-pink-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No comments found for this account
          </div>
        )}
      </div>
    </div>
  );
};
