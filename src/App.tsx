/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  FileText, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Trash2,
  ChevronRight,
  FileUp,
  BrainCircuit,
  LogOut,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Star,
  Mic,
  MicOff,
  History,
  Plus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, loginWithGoogle, db } from './lib/firebase';
import { askGemini, DocumentData } from './services/geminiService';
import { useVoice } from './hooks/useVoice';
import { useSTT } from './hooks/useSTT';
import { useUsageLimit } from './hooks/useUsageLimit';
import { Intro } from './components/Intro';
import { Mascot } from './components/Mascot';
import { HelpSection } from './components/HelpSection';
import { RatingModal } from './components/RatingModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

import { PaymentModal } from './components/PaymentModal';

interface Conversation {
  id: string;
  title: string;
  updatedAt: any;
  messages: Message[];
  fileName?: string;
  userId: string;
}

interface MainInterfaceProps {
  user: any;
  file: DocumentData | null;
  setFile: (f: DocumentData | null) => void;
  messages: Message[];
  setMessages: (m: any) => void;
  input: string;
  setInput: (s: string) => void;
  isLoading: boolean;
  setIsLoading: (b: boolean) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (b: boolean) => void;
  isPremiumUI: boolean;
  setIsPremiumUI: (b: boolean) => void;
  showRating: boolean;
  setShowRating: (b: boolean) => void;
  showHelp: boolean;
  setShowHelp: (b: boolean) => void;
  speak: (t: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSend: () => void;
  endSession: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  usage: any;
  setShowPayment: (b: boolean) => void;
  conversations: Conversation[];
  currentConvId: string | null;
  setCurrentConvId: (id: string | null) => void;
  startNewChat: () => void;
  deleteConversation: (id: string) => void;
}

function MainInterface({
  user,
  file,
  setFile,
  messages,
  setMessages,
  input,
  setInput,
  isLoading,
  setIsLoading,
  isVoiceEnabled,
  setIsVoiceEnabled,
  isPremiumUI,
  setIsPremiumUI,
  showRating,
  setShowRating,
  showHelp,
  setShowHelp,
  speak,
  stop,
  isSpeaking,
  handleFileUpload,
  handleSend,
  endSession,
  fileInputRef,
  usage,
  setShowPayment,
  conversations,
  currentConvId,
  setCurrentConvId,
  startNewChat,
  deleteConversation
}: MainInterfaceProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening } = useSTT((text) => {
    setInput(text);
    // Optional: auto-send if text is meaningful
    if (text.length > 5) {
      setTimeout(() => handleSend(), 500);
    }
  });

  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 2]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let vantaEffect: any = null;
    let retryCount = 0;
    const maxRetries = 10;

    const vantaInit = () => {
      const win = window as any;
      if (vantaRef.current && win.VANTA?.BIRDS && win.THREE) {
        try {
          if (vantaEffect) vantaEffect.destroy();
          vantaEffect = win.VANTA.BIRDS({
            el: vantaRef.current,
            THREE: win.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0xb9c3cc,
            color1: 0xe53b1f,
            color2: 0x79d187,
            birdSize: isPremiumUI ? 2.50 : 1.90,
            wingSpan: 31.00,
            separation: 80.00,
            backgroundAlpha: 1
          });
        } catch (e) {
          console.error("Vanta init error:", e);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(vantaInit, 500);
      }
    };

    vantaInit();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [isPremiumUI]);

  return (
    <div className="flex h-screen relative transition-all duration-1000 overflow-hidden bg-[#b9c3cc] text-[#1A1A1A]">
      {/* GLOBAL VANTA BACKGROUND - COVERS THE WHOLE SCREEN */}
      <div 
        ref={vantaRef} 
        className="absolute inset-0 z-0 bg-[#b9c3cc]" 
      />

      {/* Sidebar - Now an overlay */}
      <aside className={cn(
        "flex flex-col transition-all duration-500 ease-in-out overflow-hidden relative z-20 border-r",
        isSidebarCollapsed ? "w-0 border-transparent opacity-0" : "w-64 border-r opacity-100",
        isPremiumUI 
          ? "border-gold-500/20 bg-white/20 backdrop-blur-2xl" 
          : "border-gray-200/50 bg-white/30 backdrop-blur-2xl"
      )}>
        <div className="p-5 border-bottom border-gray-100 min-w-[256px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-gold-500 shadow-lg shadow-gold-500/10 border border-gold-500/20">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tighter italic">ASH<span className="text-gold-500">AI</span></h1>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">ROBYY Engine</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 hover:bg-gold-500/10 rounded-lg transition-colors text-gray-400 hover:text-black focus:outline-none"
              title="Close Sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full py-6 px-4 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all group",
              isPremiumUI 
                ? "border-gold-500/20 hover:border-gold-500 hover:bg-gold-500/5" 
                : "border-gray-200 hover:border-gold-500 hover:bg-gold-50"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm",
              isPremiumUI ? "bg-white/5 group-hover:bg-gold-500/20" : "bg-gray-50 group-hover:bg-white"
            )}>
              <FileUp className={cn("transition-colors", isPremiumUI ? "text-white/40 group-hover:text-gold-500" : "text-gray-400 group-hover:text-gold-500")} size={28} />
            </div>
            <span className={cn("text-xs font-black uppercase tracking-widest text-black")}>
              {file ? 'New Document' : 'Feed AI Data'}
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.txt,.md,.doc"
            />
          </button>
          <div className="mt-8 space-y-4">
            <h2 className="text-[10px] uppercase tracking-widest font-black opacity-30 italic">Usage Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "p-4 rounded-2xl border transition-all",
                isPremiumUI ? "bg-white/5 border-gold-500/20" : "bg-gray-50 border-gray-100"
              )}>
                <p className="text-[9px] font-black uppercase opacity-40 mb-1" style={{ height: '10px' }}>Uploads</p>
                <p className="text-xl font-black italic tracking-tighter text-gold-600">
                  {usage?.isPremium ? '∞' : usage?.uploadCount ?? 0}
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-2xl border transition-all",
                isPremiumUI ? "bg-white/5 border-gold-500/20" : "bg-gray-50 border-gray-100"
              )}>
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Brain Queries</p>
                <p className="text-xl font-black italic tracking-tighter text-gold-600">
                  {usage?.isPremium ? '∞' : usage?.chatCount ?? 0}
                </p>
              </div>
            </div>
            {!usage?.isPremium && (
              <p className="text-[8px] font-bold uppercase tracking-widest opacity-30 text-center">
                +1 Refill/Hr • 10 Max Capacity
              </p>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-w-[256px]">
          <div className="px-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] uppercase tracking-widest font-black opacity-30 italic flex items-center gap-2">
                <History size={12} /> Recent Synapses
              </h2>
              <button 
                onClick={startNewChat}
                className="p-1 hover:text-gold-500 transition-colors"
                title="New Chat"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 opacity-20">
                  <MessageSquare size={24} className="mx-auto mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest">No Brain Records</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => setCurrentConvId(conv.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3",
                        currentConvId === conv.id
                          ? "bg-gold-500/10 border-gold-500/30 text-gold-700"
                          : "bg-transparent border-transparent hover:bg-white/50 text-gray-500 hover:text-black"
                      )}
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black italic truncate leading-tight">{conv.title}</p>
                        <p className="text-[8px] uppercase opacity-40 font-bold">
                          {conv.updatedAt?.toDate?.() ? conv.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] uppercase tracking-widest font-black opacity-30 italic">Active Neural State</h2>
              <button onClick={() => setShowHelp(!showHelp)} className="p-1 hover:text-gold-500 transition-colors">
                <HelpCircle size={14} />
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {showHelp ? (
                <motion.div key="help" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <HelpSection />
                </motion.div>
              ) : file ? (
                <motion.div 
                  key="file"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-5 rounded-2xl border relative group transition-all",
                    isPremiumUI ? "bg-white/5 border-gold-500/20" : "bg-gray-50 border-gray-100 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gold-500/10 text-gold-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black truncate text-black">{file.name}</p>
                      <p className="text-[10px] uppercase font-bold opacity-50">{file.mimeType.split('/')[1]}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="absolute -top-2 -right-2 p-1.5 bg-black border border-gold-500/20 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ) : (
                <div className="py-12 flex flex-col items-center gap-6 opacity-30">
                  <Mascot size={80} message="Ready for instructions" />
                  <p className="text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                    Robot is online.<br />Ask anything or upload data.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={cn(
          "p-3 border-t space-y-1",
          isPremiumUI ? "border-gold-500/10" : "border-gray-100"
        )}>
           <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
               <div className={cn(
                 "p-1.5 rounded-lg transition-colors",
                 isVoiceEnabled ? 'bg-gold-500 text-black' : 'bg-gray-100 text-gray-400'
               )}>
                {isVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
               </div>
               <span className="text-[10px] font-black uppercase tracking-tighter">Audio</span>
            </div>
            <button 
              onClick={() => {
                setIsVoiceEnabled(!isVoiceEnabled);
                if (isSpeaking) stop();
              }}
              className={cn(
                "w-9 h-5 rounded-full transition-all relative p-0.5",
                isVoiceEnabled ? 'bg-gold-600' : 'bg-gray-300'
              )}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white transition-all shadow-sm", isVoiceEnabled ? 'translate-x-4' : 'translate-x-0')} />
            </button>
          </div>
          
          <button 
            onClick={() => auth.signOut()}
            className="w-full py-2 px-2 flex items-center justify-between group hover:text-gold-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gold-50 overflow-hidden border border-gold-500/20">
                <img src={user.photoURL || ''} className="w-full h-full object-cover" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest truncate max-w-[120px]">{user.displayName || 'Operator'}</p>
            </div>
            <LogOut size={14} className="opacity-30 group-hover:opacity-100" />
          </button>
        </div>
      </aside>

      {/* Main Chat Area - Now an overlay */}
      <main className="flex-1 flex flex-col relative z-10 bg-transparent">
        {isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute left-4 top-4 z-50 p-2 bg-white/50 backdrop-blur-md rounded-lg border border-gray-200 text-gray-500 hover:text-black transition-all hover:scale-110 shadow-sm"
            title="Open Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        {/* Header */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 transition-all duration-1000",
          isPremiumUI 
            ? "bg-white/20 border-gold-500/10 backdrop-blur-xl" 
            : "bg-white/30 border-gray-100 backdrop-blur-xl"
        )}>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-black shadow-xl shadow-gold-500/10 flex items-center justify-center border border-gold-500/30">
                <Mascot size={28} isSpeaking={isSpeaking} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gold-500 border-2 border-white" />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isPremiumUI ? "text-gold-500" : "text-gray-400")}>
                {isLoading ? 'Processing Neural Streams...' : 'Session Ready'}
              </p>
              <p className={cn("text-sm font-black flex items-center gap-2 italic text-black")}>
                ROBYY <ChevronRight size={12} className="opacity-30" /> {file?.name || 'Awaiting Context'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => setShowPayment(true)}
              style={{ height: '40px' }}
              className="px-8 py-3 bg-black text-gold-500 border border-gold-500/40 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gold-500 hover:text-black transition-all shadow-lg active:scale-95"
            >
              <Sparkles size={14} />
              Unlock ROBYY
            </button>
          </div>
        </header>

        {/* Chat Messages Container */}
        <div className="flex-1 relative overflow-hidden bg-transparent">
          <div ref={containerRef} className="absolute inset-0 overflow-y-auto px-8 py-6 scroll-smooth">
            <motion.div 
              style={{ rotateX, transformPerspective: 1000 }}
              className="max-w-3xl mx-auto space-y-2 pb-6"
            >
            {messages.length === 0 && (
              <div className="text-center py-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Mascot size={100} message="I am ROBYY. Feed me data." />
                  <h3 className="text-4xl font-black tracking-tighter mt-6 mb-3 italic leading-[0.85] text-black">
                    PREMIUM<br />
                    <span className="gold-text">INTELLIGENCE.</span>
                  </h3>
                  <p className="text-gray-400 max-w-sm mx-auto text-base font-medium leading-relaxed mb-6">
                    Advanced document synthesis powered by ROBYY and Gemini 1.5 Flash.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Generate executive summary', 'Identify risky clauses', 'List key deadlines'].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setInput(s)}
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:border-gold-500 hover:text-gold-600 shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={cn(
                    "max-w-[70%] p-1.5 px-3 rounded-lg shadow-md transition-all duration-500",
                    message.role === 'user' 
                      ? 'bg-black text-white rounded-br-none border border-white/5' 
                      : 'bg-white/80 border border-gold-500/10 text-gray-800 rounded-bl-none backdrop-blur-md'
                  )}>
                    <div className={cn(
                      "prose prose-sm max-w-none leading-snug text-[13px] prose-p:my-0 prose-headings:my-1 first:prose-p:mt-0 last:prose-p:mb-0",
                      message.role === 'user' ? "prose-invert" : "text-gray-900"
                    )}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/80 border border-gold-500/10 px-4 py-3 rounded-xl rounded-bl-none flex items-center gap-3 shadow-lg backdrop-blur-md">
                  <div className="flex gap-1.5 items-center">
                    {[0, 0.2, 0.4].map(delay => (
                      <motion.div
                        key={delay}
                        animate={{ 
                          y: [0, -4, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.8, 
                          delay,
                          ease: "easeInOut"
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-gold-500"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold-600/60 italic">ROBYY is processing...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </motion.div>
        </div>
      </div>

        {/* Input area - Now an overlay */}
        <div className={cn(
          "p-2 border-t transition-all duration-1000",
          isPremiumUI 
            ? "bg-white/20 border-gold-500/10 backdrop-blur-xl" 
            : "bg-white/30 border-gray-100 backdrop-blur-xl"
        )}>
          <div className={cn(
            "max-w-4xl mx-auto flex items-end gap-2 p-1.5 rounded-[24px] border transition-all shadow-lg overflow-hidden",
            isPremiumUI 
              ? "bg-white/5 border-gold-500/20 focus-within:border-gold-500" 
              : "bg-gray-50 border-gray-200 focus-within:border-gold-500 focus-within:ring-[4px] focus-within:ring-gold-50"
          )}>
            <textarea 
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={file ? `Query ROBYY about "${file.name}"...` : "Talk to ROBYY or feed data..."}
              disabled={isLoading}
              className="flex-1 max-h-24 min-h-[38px] py-1.5 px-3 bg-transparent outline-none resize-none text-sm font-black italic tracking-tight placeholder:italic opacity-80"
            />
            <div className="flex gap-1.5">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={cn(
                  "w-9 h-9 rounded-[16px] flex items-center justify-center transition-all",
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-white border border-gold-500/20 text-gold-600 hover:bg-gold-50'
                )}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-9 h-9 rounded-[16px] flex items-center justify-center transition-all",
                  input.trim() && !isLoading 
                  ? 'bg-black text-gold-500 shadow-xl ring-2 ring-gold-500/10 active:scale-90 hover:-translate-y-0.5 hover:bg-gold-600 hover:text-black border border-gold-500/20' 
                  : 'bg-gray-100 text-gray-300'
                )}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto flex justify-between items-center mt-2">
            <div className="flex gap-6 opacity-30 text-[9px] font-black uppercase tracking-[0.4em]">
              <span>Neural Lab G-3</span>
              <span>Gemini Pro Vision</span>
              <span className="text-gold-600">ASH AI V2.0 PREMIUM</span>
            </div>
            
            <button 
              onClick={endSession}
              className="flex items-center gap-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-600 group-hover:bg-gold-500 group-hover:text-black transition-colors">
                <Star size={14} fill="currentColor" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-600 opacity-60 group-hover:opacity-100">Give Feedback</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, userLoading] = useAuthState(auth);
  const [showIntro, setShowIntro] = useState(true);
  const [file, setFile] = useState<DocumentData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPremiumUI, setIsPremiumUI] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'default' | 'limit'>('default');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);

  const { speak, stop, isSpeaking } = useVoice();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { usage, decrementChat, decrementUpload } = useUsageLimit(user?.uid);

  useEffect(() => {
    if (usage?.isPremium) {
      setIsPremiumUI(true);
    }
  }, [usage]);

  // Fetch conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Conversation));
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user]);

  // Load selected conversation
  useEffect(() => {
    if (currentConvId) {
      const conv = conversations.find(c => c.id === currentConvId);
      if (conv) {
        setMessages(conv.messages || []);
        if (conv.fileName) {
          setFile({ name: conv.fileName, mimeType: 'application/pdf', data: '' });
        } else {
          setFile(null);
        }
      }
    }
  }, [currentConvId]);

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setFile(null);
    setInput('');
  };

  const deleteConversation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'conversations', id));
      if (currentConvId === id) startNewChat();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const triggerLimitModal = () => {
    setPaymentMode('limit');
    setShowPayment(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!usage?.isPremium && usage && usage.uploadCount <= 0) {
      triggerLimitModal();
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      let dataString = '';
      if (uploadedFile.type === 'application/pdf') {
        dataString = (reader.result as string).split(',')[1];
      } else {
        dataString = reader.result as string;
      }
      
      const success = await decrementUpload();
      if (!success) {
        triggerLimitModal();
        return;
      }

      setFile({
        name: uploadedFile.name,
        mimeType: uploadedFile.type,
        data: dataString
      });
      
      setMessages([{
        id: 'welcome',
        role: 'model',
        content: `I've analyzed **${uploadedFile.name}**. I'm ready to answer any questions or provide a summary. What would you like to know?`
      }]);
      
      if (isVoiceEnabled) {
        speak("I have received the document. How can I help you analyze it?");
      }
    };

    if (uploadedFile.type === 'application/pdf') {
      reader.readAsDataURL(uploadedFile);
    } else {
      reader.readAsText(uploadedFile);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!usage?.isPremium && usage && usage.chatCount <= 0) {
      triggerLimitModal();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    const success = await decrementChat();
    if (!success) {
      triggerLimitModal();
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await askGemini(
        input, 
        file || undefined, 
        messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText || "I failed to process that command."
      };

      const newMessages = [...messages, userMessage, aiMessage];
      setMessages(newMessages);

      if (user) {
        if (currentConvId) {
          await updateDoc(doc(db, 'conversations', currentConvId), {
            messages: newMessages,
            updatedAt: serverTimestamp(),
            fileName: file?.name || null
          });
        } else {
          const docRef = await addDoc(collection(db, 'conversations'), {
            userId: user.uid,
            title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
            messages: newMessages,
            updatedAt: serverTimestamp(),
            fileName: file?.name || null
          });
          setCurrentConvId(docRef.id);
        }
      }

      if (isVoiceEnabled && responseText) {
        const cleanText = responseText.replace(/[#*`_~]/g, '');
        speak(cleanText);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'model',
        content: "Lost connection to the brain hub. Please check your network."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = () => {
    setIsPremiumUI(true);
    setShowRating(true);
  };

  if (showIntro) {
    return <Intro onComplete={() => setShowIntro(false)} voiceSpeak={speak} />;
  }

  if (userLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A] p-4 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_transparent_70%)]" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[40px] text-center backdrop-blur-3xl"
        >
          <Mascot size={80} />
          <h2 className="text-4xl font-black tracking-tighter mt-8 mb-4 italic uppercase">Identity Required</h2>
          <p className="text-gray-400 mb-12 font-medium">To access Ash AI's advanced document processing, please authenticate.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <MainInterface 
        user={user}
        file={file}
        setFile={setFile}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        isVoiceEnabled={isVoiceEnabled}
        setIsVoiceEnabled={setIsVoiceEnabled}
        isPremiumUI={isPremiumUI}
        setIsPremiumUI={setIsPremiumUI}
        showRating={showRating}
        setShowRating={setShowRating}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        speak={speak}
        stop={stop}
        isSpeaking={isSpeaking}
        handleFileUpload={handleFileUpload}
        handleSend={handleSend}
        endSession={endSession}
        fileInputRef={fileInputRef}
        usage={usage}
        setShowPayment={(b) => {
          setPaymentMode('default');
          setShowPayment(b);
        }}
        conversations={conversations}
        currentConvId={currentConvId}
        setCurrentConvId={setCurrentConvId}
        startNewChat={startNewChat}
        deleteConversation={deleteConversation}
      />
      <AnimatePresence>
        {showRating && <RatingModal user={user} onClose={() => setShowRating(false)} />}
        {showPayment && <PaymentModal onClose={() => setShowPayment(false)} limitReached={paymentMode === 'limit'} />}
      </AnimatePresence>
    </>
  );
}

