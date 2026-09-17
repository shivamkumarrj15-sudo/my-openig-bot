import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Link, Music, Sparkles } from 'lucide-react';

interface InstagramPostPreviewProps {
  type: 'feed' | 'carousel' | 'reel' | 'story';
  username?: string;
  profilePicUrl?: string;
  mediaUrls: string[];
  caption: string;
  hashtags?: string[];
  location?: string;
  storyLink?: string;
  storyLinkText?: string;
}

export const InstagramPostPreview: React.FC<InstagramPostPreviewProps> = ({
  type,
  username = 'your_account',
  profilePicUrl,
  mediaUrls,
  caption,
  hashtags = [],
  location,
  storyLink,
  storyLinkText
}) => {
  const currentMedia = mediaUrls[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>Live Instagram Preview</span>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-[320px] rounded-[36px] bg-black border-[6px] border-slate-800 shadow-2xl overflow-hidden relative text-white select-none">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-black ml-auto mr-2"></div>
        </div>

        {/* Story Format Preview */}
        {type === 'story' ? (
          <div className="relative h-[560px] bg-slate-900 flex flex-col justify-between p-4 overflow-hidden">
            {/* Story Background Image */}
            <img src={currentMedia} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

            {/* Story Top Bar */}
            <div className="relative z-10 pt-4 space-y-2">
              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/40 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-white rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500 overflow-hidden bg-slate-800">
                    <img src={profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold">{username}</span>
                    <span className="text-[10px] text-slate-300 ml-1.5">1h</span>
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Link Sticker if available */}
            {storyLink && (
              <div className="relative z-10 self-center bg-white/95 text-slate-900 px-3.5 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 text-xs font-bold animate-bounce">
                <Link className="w-3.5 h-3.5 text-blue-500" />
                <span className="max-w-[150px] truncate">{storyLinkText || 'Visit Link'}</span>
              </div>
            )}

            {/* Story Bottom Reply */}
            <div className="relative z-10 flex items-center gap-2 pt-2">
              <div className="flex-1 px-3 py-2 rounded-full border border-white/40 text-xs text-white/70 bg-black/30 backdrop-blur-md">
                Send message...
              </div>
              <Heart className="w-6 h-6 text-white" />
              <Send className="w-6 h-6 text-white -rotate-45" />
            </div>
          </div>
        ) : (
          /* Feed Post & Reel Format Preview */
          <div className="h-[560px] bg-black flex flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div>
              <div className="pt-7 px-4 pb-2.5 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <img
                      src={profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover rounded-full bg-slate-900"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">{username}</span>
                    {location && <span className="text-[10px] text-slate-400 block">{location}</span>}
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-300" />
              </div>

              {/* Media Container */}
              <div className="relative aspect-square w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                <img src={currentMedia} alt="Post preview" className="w-full h-full object-cover" />
                {mediaUrls.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/60 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white backdrop-blur-sm">
                    1/{mediaUrls.length}
                  </span>
                )}
                {type === 'reel' && (
                  <span className="absolute bottom-2.5 left-2.5 bg-black/60 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white flex items-center gap-1 backdrop-blur-sm">
                    <Music className="w-2.5 h-2.5" />
                    <span>Original Audio</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Heart className="w-5 h-5 text-white hover:text-red-500 transition-colors" />
                  <MessageCircle className="w-5 h-5 text-white" />
                  <Send className="w-5 h-5 text-white -rotate-12" />
                </div>
                <Bookmark className="w-5 h-5 text-white" />
              </div>

              {/* Likes & Caption */}
              <div className="px-3 py-1 text-xs space-y-1">
                <span className="font-bold block text-[11px]">2,418 likes</span>
                <p className="leading-snug text-slate-200">
                  <span className="font-bold mr-1.5 text-white">{username}</span>
                  {caption || 'Add your caption here...'}
                </p>
                {hashtags && hashtags.length > 0 && (
                  <p className="text-blue-400 text-[11px] font-medium">
                    {hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 block pt-1 uppercase">2 hours ago</span>
              </div>
            </div>

            {/* Bottom Fake Navigation Bar */}
            <div className="h-10 border-t border-slate-900 bg-black flex items-center justify-around text-slate-400">
              <div className="w-4 h-4 rounded-sm border border-slate-400"></div>
              <div className="w-4 h-4 rounded-full border border-slate-400"></div>
              <div className="w-4 h-4 rounded-sm border border-slate-400"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
