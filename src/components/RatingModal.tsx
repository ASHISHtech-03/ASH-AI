import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, X, CheckCircle } from 'lucide-react';

export const RatingModal = ({ user, onClose }: { user: any, onClose: () => void }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsLoading(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          email: user?.email,
          userName: user?.displayName
        })
      });
      setSubmitted(true);
      setTimeout(onClose, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-8 text-center">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <h2 className="text-2xl font-black italic tracking-tighter">SHARE THE EXPERIENCE</h2>
                    <p className="text-sm text-gray-500 font-medium lowercase">Rate your session with Ash AI</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        size={40} 
                        fill={(hover || rating) >= star ? "#4F46E5" : "none"} 
                        className={(hover || rating) >= star ? "text-indigo-600" : "text-gray-200"}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked (or didn't)..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-indigo-500 text-sm font-medium resize-none"
                />

                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isLoading}
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : <><Send size={16} /> Submit Feedback</>}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 space-y-4"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Thank you!</h3>
                <p className="text-gray-500 font-medium">Your feedback has been submitted successfully to the team</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
