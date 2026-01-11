
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Post, User } from '../types';

interface FeedViewProps {
  user: User;
}

const FeedView: React.FC<FeedViewProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Fix: Added missing state variables for the post creation form
  const [newPostText, setNewPostText] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<Record<string, boolean>>({}); 
  // Fix: Use 'any' for the IntersectionObserver ref to resolve "Cannot find name" in restricted environments
  const observer = useRef<any>(null);

  const generatePostImage = async (postId: string, content: string, customPrompt?: string) => {
    setIsGeneratingImage(prev => ({ ...prev, [postId]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const finalPrompt = customPrompt 
        ? `A high-quality, vibrant, photorealistic image of: ${customPrompt}. Beautiful lighting, Indian context.`
        : `A professional photograph representing: "${content}" in a modern or traditional Indian setting. 8k resolution, authentic.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, imageUrl } : p));
      }
    } catch (error) {
      console.error('Image Generation error:', error);
    } finally {
      setIsGeneratingImage(prev => ({ ...prev, [postId]: false }));
    }
  };

  const fetchPosts = async (isInitial = false) => {
    if (loading || loadingMore) return;
    
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const categories = ["इतिहास", "व्यंजन", "यात्रा", "विज्ञान", "कला", "अनसुने नायक", "त्योहार", "आधुनिक भारत"];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `भारत के बारे में 3 बिल्कुल नए और अनोखे सोशल मीडिया पोस्ट हिंदी में जेनरेट करें। विषय: ${randomCategory} और अन्य सामान्य भारतीय समाचार। सुनिश्चित करें कि जानकारी ताज़ा और दिलचस्प हो। फॉर्मेट JSON होना चाहिए।`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING, description: 'A realistic Indian name or handle' },
                category: { type: Type.STRING },
                content: { type: Type.STRING, description: 'Engaging post content in Hindi' },
                link: { type: Type.STRING },
                imagePrompt: { type: Type.STRING, description: 'Visual description for AI image generation in English' }
              },
              required: ['author', 'category', 'content', 'imagePrompt']
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      const newPosts: Post[] = data.map((p: any, i: number) => {
        const id = `post-${Date.now()}-${i}-${Math.random()}`;
        generatePostImage(id, p.content, p.imagePrompt);
        
        return {
          id,
          author: p.author,
          category: p.category,
          content: p.content,
          link: p.link || 'https://india.gov.in',
          likes: Math.floor(Math.random() * 1000) + 100,
          timestamp: Date.now() - (i * 1000 * 60 * 30), // staggered timing
          imageUrl: undefined
        };
      });

      setPosts(prev => [...prev, ...newPosts]);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Last element ref for infinite scroll
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    // Fix: Access IntersectionObserver via window to resolve "Cannot find name" error
    observer.current = new (window as any).IntersectionObserver((entries: any[]) => {
      if (entries[0].isIntersecting) {
        fetchPosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const post: Post = {
      id: `user-post-${Date.now()}`,
      author: user.name,
      category: 'समुदाय',
      content: newPostText,
      likes: 0,
      timestamp: Date.now(),
      imageUrl: undefined 
    };

    setPosts(prev => [post, ...prev]);
    setNewPostText('');
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.content.toLowerCase().includes(query) || 
      post.category.toLowerCase().includes(query) || 
      post.author.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header and Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-brand text-slate-800">डिस्कवरी फीड</h2>
          <button 
            onClick={() => { setPosts([]); fetchPosts(true); }}
            disabled={loading}
            className="text-orange-600 font-bold text-sm flex items-center hover:bg-orange-50 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" />
            </svg>
            ताज़ा करें
          </button>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <div className="flex items-center bg-white rounded-3xl shadow-sm border-2 transition-all p-1.5 border-slate-200 focus-within:border-orange-400 focus-within:shadow-md">
            <div className="pl-4 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as any).value)}
              placeholder="भारत फीड में खोजें..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm md:text-base text-slate-800 placeholder-slate-400 font-bold"
            />
          </div>
        </div>
      </div>

      {/* New Post Creator */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 px-1">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-xs">
            {user.name[0]}
          </div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">आप क्या साझा करना चाहते हैं?</h3>
        </div>
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText((e.target as any).value)}
            placeholder="भारत के बारे में अपनी कहानी या विचार बताएं..."
            className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm md:text-base focus:ring-2 focus:ring-orange-500 transition-all min-h-[100px] resize-none placeholder-slate-400 font-medium"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newPostText.trim()}
              className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-orange-200"
            >
              पोस्ट करें
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-8">
        {filteredPosts.map((post, index) => {
          const isLastElement = filteredPosts.length === index + 1;
          return (
            <div 
              key={post.id} 
              ref={isLastElement ? lastPostElementRef : null}
              className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group animate-fade-in"
            >
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-xs font-bold text-white uppercase">{post.author.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-none mb-1">{post.author}</h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <span className="text-orange-600">{post.category}</span>
                        <span>•</span>
                        <span>{new Date(post.timestamp).toLocaleDateString('hi-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed text-sm md:text-base mb-6 font-bold">
                  {post.content}
                </p>
              </div>

              <div className="px-6 pb-6">
                {post.imageUrl ? (
                  <div className="rounded-3xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 relative aspect-[16/9]">
                    <img src={post.imageUrl} alt="AI दृश्य" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-white/20">
                      एआई दृश्य
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 py-16 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">दृश्य बन रहा है...</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <span className="text-xs font-bold">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-slate-500 hover:text-orange-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <span className="text-xs font-bold">चर्चा करें</span>
                  </button>
                </div>
                {post.link && (
                  <a href={post.link} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all">और जानें</a>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Skeletons for more posts */}
        {loadingMore && (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-[2rem]"></div>
            <div className="flex flex-col items-center py-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">भारत की और कहानियाँ खोज रहे हैं...</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">नमस्ते! आपका फीड तैयार हो रहा है...</p>
          </div>
        )}

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">फिलहाल यहाँ शांति है...</p>
            <button onClick={() => fetchPosts(true)} className="mt-4 text-orange-600 font-bold hover:underline">समाचार प्राप्त करें</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedView;
