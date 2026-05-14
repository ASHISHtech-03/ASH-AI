import { motion } from 'motion/react';
import { Mascot } from './Mascot';
import { useEffect, useState, useRef } from 'react';

export const Intro = ({ onComplete, voiceSpeak }: { onComplete: () => void, voiceSpeak: (t: string) => void }) => {
  const [step, setStep] = useState(0);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vantaEffect: any = null;
    const win = window as any;
    
    if (vantaRef.current && win.VANTA?.RINGS && win.THREE) {
      vantaEffect = win.VANTA.RINGS({
        el: vantaRef.current,
        THREE: win.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: 0x0,
        color: 0xd4af37,
        backgroundAlpha: 1
      });
    }

    const sequence = async () => {
      // Wait for font/init
      await new Promise(r => setTimeout(r, 1000));
      setStep(1); // Show Robot
      voiceSpeak("Welcome");
      
      await new Promise(r => setTimeout(r, 2000));
      setStep(2); // Show Name
      
      await new Promise(r => setTimeout(r, 2000));
      onComplete();
    };
    sequence();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Vanta Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />
      
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        animate={{
          scale: step === 0 ? 0.8 : 1,
          opacity: step === 0 ? 0 : 1,
        }}
        className="flex flex-col items-center gap-12 relative z-20"
      >
        <Mascot size={140} isSpeaking={true} />
        
        <div className="overflow-hidden h-24 flex items-center justify-center">
          <motion.h1
            initial={{ y: 100 }}
            animate={{ y: step >= 2 ? 0 : 100 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-8xl font-black italic tracking-tighter text-white"
          >
            ASH<span className="text-gold-500">AI</span>
          </motion.h1>
        </div>

        <motion.div
          animate={{ opacity: step >= 1 ? 1 : 0 }}
          className="flex gap-2"
        >
          {[1,2,3,4,5].map(i => (
            <motion.div
              key={i}
              animate={{
                height: [8, 24, 8],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.1
              }}
              className="w-1.5 bg-gold-500 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* High-scaled graphic circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: 360
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] border border-gold-500/10 rounded-full pointer-events-none"
      />
    </div>
  );
};
