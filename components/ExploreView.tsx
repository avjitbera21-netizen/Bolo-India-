
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ExploreView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);

  const states = [
    "राजस्थान", "केरल", "पश्चिम बंगाल", "पंजाब", "तमिलनाडु", 
    "महाराष्ट्र", "असम", "गुजरात", "लद्दाख", "गोवा"
  ];

  const handleGenerate = async (searchPrompt: string) => {
    const finalPrompt = `A stunning, high-quality photograph of ${searchPrompt} in India, showing vibrant colors, traditional atmosphere, and architectural beauty. Photorealistic, 4k.`;
    setIsGenerating(true);
    setGeneratedImg(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.inlineData) {
          setGeneratedImg(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error('Image Gen error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImg) return;
    const link = document.createElement('a');
    link.href = generatedImg;
    link.download = `BoloIndia_${prompt || 'Bharat'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-brand text-slate-800">दृश्य <span className="text-orange-600">भारत</span></h2>
        <p className="text-slate-600 font-medium">एआई द्वारा बनाई गई कला के साथ भारत की सुंदरता की कल्पना करें।</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">आप क्या देखना चाहेंगे?</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt((e.target as any).value)}
                placeholder="उदा: सूर्योदय के समय ताजमहल, वाराणसी के घाट..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
              />
              <button
                onClick={() => handleGenerate(prompt)}
                disabled={!prompt.trim() || isGenerating}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-bold"
              >
                {isGenerating ? 'बना रहा हूँ...' : 'देखें'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">लोकप्रिय सुझाव</h3>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase">मुफ्त वॉलपेपर</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {states.map(state => (
                <button
                  key={state}
                  onClick={() => { setPrompt(state); handleGenerate(state); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-200 rounded-[2rem] aspect-video flex items-center justify-center overflow-hidden shadow-inner relative border-4 border-white group">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse">भारत की आत्मा को कैद कर रहा हूँ...</p>
            </div>
          ) : generatedImg ? (
            <div className="relative w-full h-full">
              <img src={generatedImg} alt="Generated India Visual" className="w-full h-full object-cover animate-fade-in" />
              {/* Free Download Button */}
              <button 
                onClick={handleDownload}
                className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border border-white/20 hover:bg-black/70 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>मुफ्त डाउनलोड</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-8">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-bold">एक राज्य चुनें या भारत की सुंदरता देखने के लिए टाइप करें।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreView;
