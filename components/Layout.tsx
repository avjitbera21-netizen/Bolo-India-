
import React, { useEffect, useState } from 'react';
import { AppView, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, user }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("यह ऐप आपके ब्राउज़र में पहले से इंस्टॉल है या आपका डिवाइस इसे सपोर्ट नहीं करता। (Chrome/Edge इस्तेमाल करें)");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b-4 border-orange-500 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setView('feed')}>
            <div className="relative group">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border-2 border-orange-400 logo-glow transition-transform group-hover:scale-110">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-orange-600 via-white to-emerald-600"></div>
                <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-3xl logo-text leading-none mb-0.5">BOLO INDIA</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-none">Voice of New India</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
            {[
              { id: 'feed', label: 'डिस्कवरी फीड' },
              { id: 'chat', label: 'स्मार्ट चैट' },
              { id: 'live', label: 'लाइव बोलो' },
              { id: 'explore', label: 'भारत खोजें' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as AppView)}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                  activeView === item.id 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
             {/* New Install Button */}
             <button 
               onClick={handleInstall}
               className="bg-emerald-600 text-white p-2 md:px-4 md:py-2 rounded-2xl flex items-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               <span className="hidden md:inline text-xs font-black">ऐप इंस्टॉल करें</span>
             </button>

             {user && (
               <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                 <div className="text-right">
                   <p className="text-xs font-black text-slate-900 leading-tight">नमस्ते, {user.name}</p>
                   <p className="text-[9px] text-orange-600 font-bold uppercase tracking-wider">अतिथि मोड</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-2 border-white shadow-md">
                   <span className="text-white font-black text-sm">{user.name[0]}</span>
                 </div>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <nav className="md:hidden sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 px-2">
        <button onClick={() => setView('feed')} className={`flex flex-col items-center transition-all ${activeView === 'feed' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
           <span className="text-[10px] mt-1 font-black">फीड</span>
        </button>
        <button onClick={() => setView('chat')} className={`flex flex-col items-center transition-all ${activeView === 'chat' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
           <span className="text-[10px] mt-1 font-black">चैट</span>
        </button>
        <button onClick={() => setView('live')} className={`flex flex-col items-center group`}>
           <div className={`p-4 rounded-full -mt-10 bg-black border-4 shadow-2xl transition-all ${activeView === 'live' ? 'border-orange-500 scale-125' : 'border-white'}`}>
             <svg className={`w-8 h-8 ${activeView === 'live' ? 'text-orange-500' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
               <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
             </svg>
           </div>
           <span className="text-[10px] mt-1 font-black text-slate-800">बोलो</span>
        </button>
        <button onClick={() => setView('explore')} className={`flex flex-col items-center transition-all ${activeView === 'explore' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           <span className="text-[10px] mt-1 font-black">खोजें</span>
        </button>
      </nav>

      <footer className="hidden md:block py-10 border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 grayscale opacity-50">
            <span className="text-xl font-black logo-text">BOLO INDIA</span>
          </div>
          <p className="text-sm font-medium text-center">
            © 2024 बोलो इंडिया। भारत की विविधता, संस्कृति और आत्मा का उत्सव मनाएं।<br/>
            <span className="text-slate-600 text-[10px] uppercase tracking-widest mt-2 block">Made for Bharat with ❤️</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
