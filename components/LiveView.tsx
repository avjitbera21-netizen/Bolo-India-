
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audioHelper';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const audioContextRef = useRef<any>(null);
  const outputAudioContextRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<any>>(new Set());
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    setIsConnecting(true);
    setTranscript([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);

            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.outputTranscription) {
               const text = message.serverContent.outputTranscription.text;
               setTranscript(prev => [...prev.slice(-10), `बोलो इंडिया: ${text}`]);
            } else if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               setTranscript(prev => [...prev.slice(-10), `आप: ${text}`]);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: 'आपका नाम "बोलो इंडिया" है। आप भारतीय संस्कृति, भाषा और भूगोल के विशेषज्ञ हैं। हमेशा हिंदी में बात करें। गर्मजोशी से, सम्मानपूर्वक और मददगार बनें। स्पष्ट बोलें और "नमस्ते", "नमस्कार" या "राधे-राधे" जैसे भारतीय अभिवादनों का प्रयोग करें।',
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnecting(false);
      (window as any).alert('लाइव सुविधा के लिए माइक्रोफ़ोन एक्सेस आवश्यक है।');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
  };

  return (
    <div className="flex flex-col items-center space-y-12 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-brand text-slate-800">बोलो <span className="text-orange-600">भारत</span></h2>
        <p className="text-slate-600 max-w-lg font-medium">हमारे सांस्कृतिक एआई (AI) के साथ रीयल-टाइम आवाज में बातचीत का अनुभव करें। हिंदी, अंग्रेजी या किसी भी भारतीय भाषा में बोलें।</p>
      </div>

      <div className="relative flex flex-col items-center">
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isActive ? '' : 'hidden'}`}>
           <div className="w-64 h-64 bg-orange-500/10 rounded-full animate-ripple"></div>
           <div className="w-64 h-64 bg-orange-500/20 rounded-full animate-ripple [animation-delay:0.5s]"></div>
           <div className="w-64 h-64 bg-orange-500/30 rounded-full animate-ripple [animation-delay:1s]"></div>
        </div>

        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 scale-105' 
              : 'bg-gradient-to-tr from-orange-500 to-orange-600 hover:scale-105 shadow-orange-200'
          }`}
        >
          {isConnecting ? (
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isActive ? (
            <>
              <svg className="w-12 h-12 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-white font-bold uppercase tracking-widest text-sm">बंद करें</span>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-white font-bold uppercase tracking-widest text-sm">बोलो</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">लाइव ट्रांसक्रिप्शन</h3>
        <div className="h-40 overflow-y-auto space-y-2 text-sm text-slate-700 font-bold">
          {transcript.length > 0 ? transcript.map((line, i) => (
            <p key={i} className={line.startsWith('आप:') ? 'text-orange-600' : 'text-slate-600'}>
              {line}
            </p>
          )) : (
            <p className="text-slate-400 italic">बातचीत यहाँ रीयल-टाइम में दिखाई देगी...</p>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-slate-600 font-bold">लो लेटेंसी सक्षम</span>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
          <span className="text-xs text-slate-600 font-bold">बहुभाषी समर्थन</span>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
