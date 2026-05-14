import { motion } from 'motion/react';

export const Mascot = ({ size = 64, isSpeaking = false, message = "" }: { size?: number, isSpeaking?: boolean, message?: string }) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        }}
        className="w-full h-full relative"
      >
        {/* Robot Body */}
        <div className="absolute inset-0 bg-[#1A1A1A] rounded-2xl shadow-xl border-4 border-[#D4AF37] overflow-hidden">
          <div className="absolute top-2 left-2 right-2 h-1/2 bg-black rounded-lg flex items-center justify-center gap-2">
            {/* Eyes */}
            <motion.div 
              animate={{
                scaleY: [1, 1.2, 0.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                times: [0, 0.9, 0.95, 1]
              }}
              className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" 
            />
            <motion.div 
              animate={{
                scaleY: [1, 1.2, 0.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                times: [0, 0.9, 0.95, 1]
              }}
              className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" 
            />
          </div>
          {/* Mouth / Speaker Area */}
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-black rounded-full flex gap-1 items-center justify-center px-2">
            {isSpeaking && [1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ height: [4, 8, 4] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                className="w-1 bg-[#D4AF37] rounded-full"
              />
            ))}
          </div>
        </div>
        
        {/* Antenna */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-[#D4AF37]">
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-2 -left-1.5 w-4 h-4 bg-gold-500 rounded-full blur-[2px]" 
          />
        </div>
      </motion.div>

      {/* Message Bubble (Optional) */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="absolute left-full ml-4 top-0 bg-white border border-gold-200 p-3 rounded-2xl rounded-bl-none shadow-lg whitespace-nowrap min-w-[150px] z-50 overflow-visible"
        >
          <p className="text-sm font-black text-gray-800 italic uppercase tracking-tighter">{message}</p>
          <div className="absolute bottom-0 -left-2 w-4 h-4 bg-white border-l border-b border-gold-200 rotate-45" />
        </motion.div>
      )}
    </div>
  );
};
