import { BookOpen, Upload, MessageSquare, Zap, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const HelpSection = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="text-indigo-500" size={20} />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Quick Guide</h2>
      </div>

      <div className="space-y-4">
        {[
          { icon: <Upload size={16} />, title: "Upload", desc: "Drag & drop any PDF or text file to start context." },
          { icon: <MessageSquare size={16} />, title: "Chat", desc: "Ask specific questions about data points." },
          { icon: <Zap size={16} />, title: "Summarize", desc: "Get high-level takeaways in seconds." },
          { icon: <BookOpen size={16} />, title: "Voice", desc: "Listen to AI responses for hands-free analysis." }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{item.title}</p>
              <p className="text-[10px] text-gray-500 leading-tight pr-4">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-2">PRO TIP</p>
        <div className="p-3 bg-indigo-50 rounded-xl">
          <p className="text-[10px] text-indigo-700 font-medium">Use "Extract all dates" or "Find all names" for structured insights!</p>
        </div>
      </div>
    </div>
  );
};
