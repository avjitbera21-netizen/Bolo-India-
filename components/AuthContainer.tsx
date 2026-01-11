
import React, { useState } from 'react';
import { AuthScreen, User } from '../types';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';

interface AuthContainerProps {
  onAuthComplete: (user: User) => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthComplete }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const getHindiErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/user-not-found': return 'उपयोगकर्ता नहीं मिला। कृपया साइन अप करें।';
      case 'auth/wrong-password': return 'गलत पासवर्ड। कृपया पुनः प्रयास करें।';
      case 'auth/email-already-in-use': return 'यह ईमेल पहले से उपयोग में है।';
      case 'auth/invalid-email': return 'अमान्य ईमेल प्रारूप।';
      case 'auth/weak-password': return 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।';
      default: return 'क्षमा करें, कुछ गलत हुआ। कृपया पुनः प्रयास करें।';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (screen === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        onAuthComplete({ email, name });
      } else if (screen === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthComplete({ 
          email: userCredential.user.email || email, 
          name: userCredential.user.displayName || email.split('@')[0] 
        });
      } else if (screen === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage({ type: 'success', text: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।' });
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setMessage({ type: 'error', text: getHindiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-orange-500 via-white to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-slate-800 tracking-tighter">BI</span>
          </div>
          <h2 className="text-3xl font-brand text-slate-900">
            {screen === 'login' && 'स्वागत है'}
            {screen === 'signup' && 'बोलो इंडिया से जुड़ें'}
            {screen === 'reset' && 'पासवर्ड रीसेट करें'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            {screen === 'login' && 'नमस्ते और राधे-राधे! अपने अकाउंट में लॉग इन करें'}
            {screen === 'signup' && 'भारत की खोज शुरू करने के लिए अकाउंट बनाएं'}
            {screen === 'reset' && 'अपना पंजीकृत ईमेल दर्ज करें'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} border ${message.type === 'success' ? 'border-emerald-200' : 'border-red-200'} animate-fade-in`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {screen === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">पूरा नाम</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName((e.target as any).value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                  placeholder="आपका नाम दर्ज करें"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ईमेल पता</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail((e.target as any).value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                placeholder="email@domain.com"
              />
            </div>
            {screen !== 'reset' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">पासवर्ड</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword((e.target as any).value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-orange-600 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-100"
            >
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                screen === 'login' ? 'लॉगिन करें' : (screen === 'signup' ? 'साइन अप करें' : 'रीसेट लिंक भेजें')
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-col space-y-4 text-center text-sm">
          {screen === 'login' && (
            <>
              <button onClick={() => setScreen('signup')} className="text-orange-600 hover:text-orange-500 font-bold">नया अकाउंट बनाना चाहते हैं? यहाँ क्लिक करें</button>
              <button onClick={() => setScreen('reset')} className="text-slate-500 hover:text-slate-700 font-medium">पासवर्ड भूल गए? इसे रीसेट करें</button>
            </>
          )}
          {screen === 'signup' && (
            <button onClick={() => setScreen('login')} className="text-orange-600 hover:text-orange-500 font-bold">पहले से अकाउंट है? लॉगिन करें</button>
          )}
          {screen === 'reset' && (
            <button onClick={() => setScreen('login')} className="text-orange-600 hover:text-orange-500 font-bold">वापस लॉगिन स्क्रीन पर जाएं</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
