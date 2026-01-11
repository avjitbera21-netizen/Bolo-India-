
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'नमस्ते और राधे-राधे! मैं आपका "बोलो इंडिया" सहायक हूँ। मुझसे भारत के बारे में कुछ भी पूछें—इतिहास और भोजन से लेकर नवीनतम समाचार या यात्रा के सुझावों तक।',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<{web: {uri: string, title: string}}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      (scrollRef.current as any).scrollTop = (scrollRef.current as any).scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setGroundingLinks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: 'आपका नाम "बोलो इंडिया" है। आप भारत के बारे में एक गर्वित और जानकार सहायक हैं। हमेशा हिंदी में उत्तर दें। विनम्र, सांस्कृतिक रूप से सम्मानजनक और अंतर्दृष्टिपूर्ण बनें। उपयुक्त होने पर भारतीय मुहावरों का प्रयोग करें और बातचीत में "नमस्ते" के साथ-साथ "राधे-राधे" जैसे पवित्र अभिवादनों का उपयोग करें।',
          tools: [{ googleSearch: {} }]
        }
      });

      const modelText = response.text || "क्षमा करें, मैं इसे समझ नहीं पाया। क्या आप कृपया फिर से पूछ सकते हैं?";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setGroundingLinks(chunks as any);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'क्षमा करें, भारत के हृदय से जुड़ने में कोई समस्या हुई। कृपया अपना कनेक्शन जांचें।',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/30"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] relative rounded-2xl p-4 md:p-5 ${
              msg.role === 'user' 
                ? 'bg-orange-600 text-white shadow-lg rounded-tr-none' 
                : 'bg-white text-slate-800 shadow-sm border border-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">{msg.text}</p>
              <span className={`text-[10px] mt-2 block font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-orange-200' : 'text-slate-400'}`}>
                {msg.role === 'user' ? 'आप' : 'बोलो इंडिया'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          </div>
        )}

        {groundingLinks.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <h4 className="text-[10px] font-bold text-blue-600 mb-3 uppercase tracking-widest">ज्ञान के स्रोत</h4>
            <div className="flex flex-wrap gap-2">
              {groundingLinks.map((link, idx) => link.web && (
                <a 
                  key={idx} 
                  href={link.web.uri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-slate-700 hover:text-blue-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 transition-all flex items-center space-x-1 shadow-sm font-bold"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  <span className="truncate max-w-[150px]">{link.web.title || 'स्रोत देखें'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative group">
          <div className="flex items-center bg-slate-100 rounded-2xl transition-all border-2 border-transparent group-focus-within:border-slate-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput((e.target as any).value)}
              placeholder="भारत की संस्कृति, समाचार या यात्रा के बारे में पूछें..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-4 text-sm md:text-base text-slate-800 placeholder-slate-400 font-medium"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="m-2 bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 disabled:opacity-30 transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
