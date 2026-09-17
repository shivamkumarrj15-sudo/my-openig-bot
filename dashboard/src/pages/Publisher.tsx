import React, { useState, useEffect } from 'react';
import {
  Send,
  Image,
  Video,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  MapPin,
  Link,
  Hash,
  CheckCircle2,
  Loader2,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { InstagramPostPreview } from '../components/InstagramPostPreview';

interface PublisherProps {
  selectedSessionId: string;
  sessions: any[];
}

export const Publisher: React.FC<PublisherProps> = ({ selectedSessionId, sessions }) => {
  const [postType, setPostType] = useState<'feed' | 'carousel' | 'reel' | 'story'>('feed');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
  const [carouselUrls, setCarouselUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
  ]);
  const [caption, setCaption] = useState('🚀 Launching our new automation suite powered by OpenIG! Experience self-hosted Instagram power without limits.\n\nDrop a comment below with "LINK" for early access! 👇');
  const [hashtagInput, setHashtagInput] = useState('#InstagramAPI #OpenSource #DevTools #Automation #Tech');
  const [location, setLocation] = useState('San Francisco, California');
  const [storyLink, setStoryLink] = useState('https://openig.dev');
  const [storyLinkText, setStoryLinkText] = useState('Learn More');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isScheduledMode, setIsScheduledMode] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await api.uploadMedia(file);
      if (res && res.url) {
        setMediaUrl(res.url);
        if (postType === 'carousel') {
          setCarouselUrls(prev => [res.url, ...prev]);
        }
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingFile(false);
    }
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const fetchPosts = async () => {
    try {
      const data = await api.getPosts(selectedSessionId);
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedSessionId]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    setPublishing(true);
    setSuccessMsg(null);

    const mediaList = postType === 'carousel' ? carouselUrls : [mediaUrl];
    const extractedHashtags = hashtagInput
      .split(/\s+/)
      .filter(h => h.startsWith('#'))
      .map(h => h.substring(1));

    try {
      const payload: any = {
        type: postType,
        mediaUrls: mediaList,
        caption,
        hashtags: extractedHashtags,
        location: location || undefined,
        storyLink: postType === 'story' ? storyLink : undefined,
        storyLinkText: postType === 'story' ? storyLinkText : undefined,
        scheduledFor: isScheduledMode && scheduledFor ? new Date(scheduledFor).toISOString() : undefined
      };

      const result = await api.createPost(selectedSessionId, payload);
      setSuccessMsg(isScheduledMode ? 'Post successfully scheduled!' : 'Post published to Instagram successfully!');
      await fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(postId);
      await fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const sampleImages = [
    { label: 'Cyber Minimal', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
    { label: 'Retro Tech', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Studio Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send className="w-5 h-5 text-pink-400" />
          <span>Post & Story Studio</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Design, preview, immediately publish, or schedule Feed Posts, Carousels, Reels, and Stories
        </p>
      </div>

      {/* Main Studio Grid: Editor + Live Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 columns */}
        <div className="lg:col-span-7 bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Format Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'feed', label: 'Feed Post', icon: Image },
                { id: 'carousel', label: 'Carousel', icon: Layers },
                { id: 'reel', label: 'Reel Video', icon: Video },
                { id: 'story', label: '24h Story', icon: Sparkles }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id as any)}
                    className={`py-3 px-2 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-tr from-pink-500 to-orange-500 text-white shadow-md shadow-pink-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media URL & Direct File Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                {postType === 'reel' ? 'Video / Reel Media' : 'Photo / Media Asset'}
              </label>
              <label className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-lg border border-pink-500/30 transition-all shadow-sm">
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
            </div>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste Image URL or click 'Upload from Device' above..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-pink-500"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400">Sample Assets:</span>
              {sampleImages.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaUrl(s.url)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption & Hashtags (For feed, carousel, reel) */}
          {postType !== 'story' ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Caption</label>
                  <span className="text-[11px] text-slate-400">{caption.length}/2200 chars</span>
                </div>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write an engaging caption..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-pink-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Hashtags</label>
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="#InstagramAPI #Growth #Tech"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-pink-400 text-xs font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location Tag (Optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, California"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          ) : (
            /* Story Link Sticker Settings */
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-wider">
                <Link className="w-4 h-4" />
                <span>Interactive Story Link Sticker</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={storyLink}
                    onChange={(e) => setStoryLink(e.target.value)}
                    placeholder="https://mywebsite.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Custom Sticker Text</label>
                  <input
                    type="text"
                    value={storyLinkText}
                    onChange={(e) => setStoryLinkText(e.target.value)}
                    placeholder="e.g. Shop Now!"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Schedule Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Schedule For Later</span>
                  <span className="text-[11px] text-slate-400 block">Automated publishing via background cron queue</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isScheduledMode}
                onChange={(e) => setIsScheduledMode(e.target.checked)}
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />
            </div>

            {isScheduledMode && (
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Publication...</span>
              </>
            ) : isScheduledMode ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Schedule Post</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish to Instagram Now</span>
              </>
            )}
          </button>
        </div>

        {/* Right Phone Mockup Preview: 5 columns */}
        <div className="lg:col-span-5 flex justify-center sticky top-6">
          <InstagramPostPreview
            type={postType}
            username={currentSession?.username || 'brand_official'}
            profilePicUrl={currentSession?.profilePicUrl}
            mediaUrls={postType === 'carousel' ? carouselUrls : [mediaUrl]}
            caption={caption}
            hashtags={hashtagInput.split(/\s+/).filter(Boolean)}
            location={location}
            storyLink={storyLink}
            storyLinkText={storyLinkText}
          />
        </div>
      </div>

      {/* Scheduled & Published Posts Table */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pink-400" />
          <span>Posts Queue & History</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Media</th>
                <th className="py-3 px-4">Caption Snippet</th>
                <th className="py-3 px-4">Schedule / Published Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 uppercase font-bold text-pink-400 font-mono">{post.type}</td>
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800">
                      <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate">{post.caption || '[Story Image]'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : new Date(post.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      post.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : post.status === 'scheduled'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete post"
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
    </div>
  );
};
