import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, CreditCard, Sparkles, ExternalLink } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const PaymentModal = ({ onClose, limitReached = false }: { onClose: () => void, limitReached?: boolean }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vantaEffect: any = null;
    const win = window as any;

    if (vantaRef.current && win.VANTA?.GLOBE && win.THREE) {
      vantaEffect = win.VANTA.GLOBE({
        el: vantaRef.current,
        THREE: win.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xffc23f,
        color2: 0x312323,
        backgroundColor: 0xc3b7d6
      });
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  useEffect(() => {
    if (completed || failed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailed(true);
          setTimeout(onClose, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completed, failed, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const plans = [
    { 
      id: 'weekly', 
      name: 'Weekly', 
      price: '99/-', 
      desc: 'Full access for 7 days',
      link: 'https://rzp.io/rzp/99ash'
    },
    { 
      id: 'monthly', 
      name: 'Monthly', 
      price: '299/-', 
      desc: 'Best for active projects',
      link: 'https://rzp.io/rzp/299ash'
    },
  ];

  const handlePayClick = (link: string) => {
    window.open(link, '_blank');
  };

  const verifyCode = async () => {
    if (!auth.currentUser || code.length !== 4) return;
    
    setIsVerifying(true);
    
    // Simulate checking with owner/server
    // For now, let's use a master code "2024" for demonstration
    setTimeout(async () => {
      if (code === '2024' || code === '8888') { // Example codes
        try {
          const userRef = doc(db, 'users', auth.currentUser!.uid);
          await updateDoc(userRef, {
            isPremium: true,
            uploadCount: 999999,
            chatCount: 999999
          });
          setCompleted(true);
          setTimeout(onClose, 4000);
        } catch (error) {
          console.error("Failed to update premium status:", error);
        }
      } else {
        // Handle incorrect code
        alert("Invalid verification code. Please check your email or contact the owner.");
      }
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      {/* Vanta Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0 shadow-inner" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col relative max-h-[95vh] z-10 border border-white/20"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-3 hover:bg-gold-50 rounded-full transition-all group active:scale-95 z-[2005]"
          aria-label="Close"
        >
          <X size={24} className="text-black group-hover:text-gold-600" strokeWidth={3} />
        </button>

        <div className="p-8 md:p-12 space-y-8 overflow-y-auto">
          <div className="flex justify-between items-start pr-12">
            <div>
              {limitReached && (
                <div className="bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                  Usage Limit Reached
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-black">
                  {limitReached ? "UNLOCK ROBYY" : "UPGRADE TO"} <span className="text-gold-600">PREMIUM</span>
                </h2>
                <div className="bg-black text-gold-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-2 self-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {formatTime(timeLeft)}
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">
                {limitReached ? "you can't access the features now, Unlock Robyy premium" : "Premium AI Intelligence"}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-8 rounded-3xl border-2 border-gray-100 transition-all flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-black italic text-2xl uppercase tracking-tighter">{plan.name} Plan</h3>
                  <p className="text-sm text-gray-500 font-bold mt-1">{plan.desc}</p>
                  <p className="text-3xl font-black text-gold-600 mt-4">{plan.price}</p>
                </div>
                
                <button
                  onClick={() => handlePayClick(plan.link)}
                  className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gold-600 transition-all shadow-xl whitespace-nowrap"
                >
                  Pay Now <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                Enter the 4 digit code received via mail by the owner after completion of the payment
              </label>
              <div className="flex justify-center gap-4">
                {[...Array(4)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        const newCode = code.split('');
                        newCode[i] = val;
                        const final = newCode.join('');
                        setCode(final);
                        // Auto-focus next
                        if (i < 3 && e.target.nextElementSibling) {
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                        }
                      } else {
                        // handle backspace
                        const newCode = code.split('');
                        newCode[i] = '';
                        setCode(newCode.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !code[i] && i > 0) {
                        const prevInput = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    className="w-16 h-16 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-3xl font-black text-black outline-none focus:border-gold-500 focus:bg-white transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={verifyCode}
                disabled={code.length !== 4 || isVerifying || completed || failed}
                className="w-full py-6 bg-gold-500 text-black rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gold-600 transition-all disabled:opacity-50 shadow-xl"
              >
                {isVerifying ? "Verifying..." : "Submit"}
              </button>
              
              <button
                onClick={() => {
                  setFailed(true);
                  setTimeout(onClose, 3000);
                }}
                disabled={isVerifying || completed || failed}
                className="w-full py-4 text-gray-500 font-black uppercase tracking-widest text-xs hover:text-red-600 transition-colors border-2 border-transparent hover:border-red-100 rounded-2xl"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Celebration Overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gold-500 flex flex-col items-center justify-center text-white z-[2001]"
            >
              <div className="flex gap-4 mb-8">
                {['😊', '🚀', '✨', '🎉', '🌟'].map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1, repeat: Infinity, repeatType: 'reverse', duration: 0.5 }}
                    className="text-6xl"
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
              <h2 className="text-6xl font-black italic tracking-tighter mb-4 text-center px-4">🎉 CONGRATULATIONS! 🎊</h2>
              <p className="text-xl font-bold uppercase tracking-[0.3em] text-center">🚀 YOU HAVE UNLOCKED ROBYY PREMIUM 💎</p>
              <div className="mt-12 w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle size={48} className="text-white" />
              </div>
            </motion.div>
          )}

          {failed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center text-white z-[2001]"
            >
              <div className="text-8xl mb-8">😢</div>
              <h2 className="text-6xl font-black italic tracking-tighter mb-4 text-center px-4">SUBSCRIPTION FAILED</h2>
              <p className="text-xl font-bold uppercase tracking-[0.3em] text-center">TIME EXPIRED OR INVALID ATTEMPT</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

