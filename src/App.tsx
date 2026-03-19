/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Github, Mic, MicOff, Copy, Check, MoreVertical, MessageSquare, Settings, PlusCircle, X, ExternalLink, Info, History, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Logo } from './components/Logo';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Ashu, your friendly AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'feedback' | 'instructions' | 'pwa' | 'about' | 'history' | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save current chat to history
  const saveCurrentToHistory = () => {
    if (messages.length <= 1) return; // Don't save empty or just-welcome sessions

    const title = messages.find(m => m.role === 'user')?.text.slice(0, 30) + '...' || 'New Chat';
    
    setHistory(prev => {
      const existingIndex = prev.findIndex(s => s.id === currentSessionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messages: [...messages],
          timestamp: new Date()
        };
        return updated;
      } else {
        return [{
          id: currentSessionId,
          title,
          messages: [...messages],
          timestamp: new Date()
        }, ...prev];
      }
    });
  };

  const loadSession = (session: ChatSession) => {
    saveCurrentToHistory();
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setActiveModal(null);
  };

  const startNewChat = () => {
    saveCurrentToHistory();
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Ashu, your friendly AI assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    setCurrentSessionId(Date.now().toString());
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are Ashu, a friendly, helpful, and witty AI assistant. Your creator is Ashish Mondal. If anyone asks who created you or who your creator is, you should proudly mention Ashish Mondal and introduce him as a talented developer. You are concise but thorough. You enjoy helping users with coding, creative writing, and general questions. You have a warm and approachable personality.",
      },
    });
  };

  const clearChat = () => {
    startNewChat();
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== sessionId));
  };

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ashu_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const formatted = parsed.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setHistory(formatted);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('ashu_history', JSON.stringify(history));
    }
  }, [history]);

  // Handle textarea auto-expansion
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 6 * 24; // Approx 6 rows (24px per row)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };
  
  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "You are Ashu, a friendly, helpful, and witty AI assistant. Your creator is Ashish Mondal. If anyone asks who created you or who your creator is, you should proudly mention Ashish Mondal and introduce him as a talented developer. You are concise but thorough. You enjoy helping users with coding, creative writing, and general questions. You have a warm and approachable personality.",
        },
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!process.env.GEMINI_API_KEY) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date(),
      }, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "API Key is missing. Please add your Gemini API key in the settings to start chatting.",
        timestamp: new Date(),
      }]);
      setInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();

    try {
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
      }]);

      const streamResponse = await chatRef.current.sendMessageStream({
        message: input,
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || '';
        fullText += chunkText;
        
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: fullText } : msg
        ));
      }
      
      // Update history after successful stream
      saveCurrentToHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = "Sorry, I encountered an unexpected error. Please try again.";
      
      if (error?.message?.includes('API_KEY_INVALID')) {
        errorMessage = "Invalid API Key. Please check your Gemini API key configuration in the settings.";
      } else if (error?.message?.includes('quota') || error?.status === 429) {
        errorMessage = "Quota exceeded. I've been talking a lot lately! Please wait a moment before sending more messages.";
      } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
        errorMessage = "I'm sorry, but I can't respond to that as it was flagged by my safety filters.";
      } else if (!navigator.onLine) {
        errorMessage = "You appear to be offline. Please check your internet connection.";
      } else if (error?.message?.includes('model not found')) {
        errorMessage = "The AI model is currently unavailable. Please try again in a few minutes.";
      }

      // Remove the empty message we added for streaming if it exists
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== modelMessageId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'model',
          text: errorMessage,
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col font-sans text-white relative overflow-hidden">
      {/* Futuristic Atmospheric Background */}
      <div className="atmosphere" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl pt-[max(1rem,env(safe-area-inset-top))] pb-4 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] flex items-center justify-between shadow-2xl border-b border-white/5">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('about')}
            className="cursor-pointer"
          >
            <Logo size={48} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl tracking-tight">Ashu</h1>
              <motion.div
                animate={{ rotate: [0, 15, 0, -15, 0], filter: ["drop-shadow(0_0_2px_#6366f1)", "drop-shadow(0_0_8px_#6366f1)", "drop-shadow(0_0_2px_#6366f1)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={16} className="text-indigo-400" />
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold">System Active</span>
            </div>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5, color: "#ef4444" }}
            whileTap={{ scale: 0.9 }}
            onClick={clearChat}
            className="p-2.5 text-white/40 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="Reset Neural Link"
          >
            <Trash2 size={20} />
          </motion.button>

          <div className="relative">
            <motion.button 
              animate={{ 
                boxShadow: isMenuOpen 
                  ? "0 0 25px rgba(99, 102, 241, 0.6)" 
                  : ["0 0 5px rgba(99, 102, 241, 0.2)", "0 0 15px rgba(99, 102, 241, 0.4)", "0 0 5px rgba(99, 102, 241, 0.2)"],
                borderColor: isMenuOpen ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.1)"
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity },
                borderColor: { duration: 0.3 }
              }}
              whileHover={{ scale: 1.1, color: "#818cf8" }}
              whileTap={{ scale: 1.2, y: -8, rotate: -5, boxShadow: "0 15px 30px rgba(99, 102, 241, 0.4)" }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 rounded-xl transition-all border ${isMenuOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}
              title="Menu"
            >
              <motion.div
                animate={isMenuOpen ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <Bot size={20} className={isMenuOpen ? "drop-shadow-[0_0_8px_#6366f1]" : ""} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40"
                  >
                    <div className="p-2 flex flex-col gap-1">
                      <button 
                        onClick={() => { setActiveModal('feedback'); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <MessageSquare size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        Feedback
                      </button>
                      <button 
                        onClick={() => { setActiveModal('instructions'); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <Settings size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        Instructions for Improvement
                      </button>
                      <button 
                        onClick={() => { setActiveModal('history'); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <History size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        Chat History
                      </button>
                      <div className="h-px bg-white/5 my-1 mx-2" />
                      <button 
                        onClick={() => { setActiveModal('pwa'); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <PlusCircle size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        Add to Home Screen
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      {activeModal === 'feedback' && <MessageSquare size={20} />}
                      {activeModal === 'instructions' && <Settings size={20} />}
                      {activeModal === 'pwa' && <PlusCircle size={20} />}
                      {activeModal === 'about' && <Bot size={20} />}
                      {activeModal === 'history' && <History size={20} />}
                    </div>
                    <h2 className="text-xl font-bold">
                      {activeModal === 'feedback' && 'Share Feedback'}
                      {activeModal === 'instructions' && 'Improve Ashu'}
                      {activeModal === 'pwa' && 'Install App'}
                      {activeModal === 'about' && 'About Ashu'}
                      {activeModal === 'history' && 'Chat History'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {activeModal === 'history' && (
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 mx-auto mb-4">
                            <History size={32} />
                          </div>
                          <p className="text-white/40 text-sm">No chat history found.</p>
                        </div>
                      ) : (
                        history.map((session) => (
                          <motion.div
                            key={session.id}
                            whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                            onClick={() => loadSession(session)}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer transition-all group relative"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                  <Clock size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white/90 line-clamp-1">{session.title}</h4>
                                  <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">
                                    {session.timestamp.toLocaleDateString()} • {session.messages.length} messages
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => deleteSession(session.id, e)}
                                  className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete Session"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <ChevronRight size={18} className="text-white/20" />
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      {history.length > 0 && (
                        <button 
                          onClick={() => { setHistory([]); localStorage.removeItem('ashu_history'); }}
                          className="w-full py-3 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all mt-4 border border-transparent hover:border-red-500/10"
                        >
                          Clear All History
                        </button>
                      )}
                    </div>
                  )}

                  {activeModal === 'about' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                        <div className="flex justify-center mb-4">
                          <Logo size={80} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Ashu v2.0</h3>
                        <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Neural Assistant</p>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed text-center">
                        Ashu is a highly advanced AI assistant designed to be your perfect digital companion. 
                        Created with passion by <span className="text-indigo-400 font-bold">Ashish Mondal</span>.
                      </p>
                      <div className="h-px bg-white/5" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                          <p className="text-[10px] text-white/30 uppercase tracking-tighter mb-1">Creator</p>
                          <p className="text-xs font-bold">Ashish Mondal</p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                          <p className="text-[10px] text-white/30 uppercase tracking-tighter mb-1">Status</p>
                          <p className="text-xs font-bold text-emerald-400">Online</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveModal(null)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all"
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {activeModal === 'feedback' && (
                    <>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Your feedback helps us make Ashu better for everyone. Please share your thoughts, report bugs, or suggest new features.
                      </p>
                      <textarea 
                        placeholder="Write your feedback here..."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                      />
                      <button 
                        onClick={() => setActiveModal(null)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Submit Feedback
                      </button>
                    </>
                  )}

                  {activeModal === 'instructions' && (
                    <>
                      <p className="text-white/60 text-sm leading-relaxed">
                        How can we improve Ashu's responses? Let us know if you'd like Ashu to be more technical, more creative, or follow specific guidelines.
                      </p>
                      <div className="space-y-3">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                          <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-white/50 leading-relaxed">
                            These instructions will be reviewed by our development team to update Ashu's core personality and knowledge base.
                          </p>
                        </div>
                        <textarea 
                          placeholder="E.g., 'Make Ashu explain code more simply' or 'Add more humor to responses'..."
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                        />
                      </div>
                      <button 
                        onClick={() => setActiveModal(null)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Save Instructions
                      </button>
                    </>
                  )}

                  {activeModal === 'pwa' && (
                    <div className="space-y-6">
                      <p className="text-white/60 text-sm leading-relaxed">
                        Install Ashu on your device for a faster, more integrated experience.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40 shrink-0">1</div>
                          <div>
                            <h4 className="text-sm font-bold mb-1">On iOS (Safari)</h4>
                            <p className="text-xs text-white/40">Tap the Share icon <ExternalLink size={12} className="inline mx-1" /> and select "Add to Home Screen".</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40 shrink-0">2</div>
                          <div>
                            <h4 className="text-sm font-bold mb-1">On Android (Chrome)</h4>
                            <p className="text-xs text-white/40">Tap the three dots <MoreVertical size={12} className="inline mx-1" /> and select "Install app" or "Add to Home screen".</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveModal(null)}
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/10"
                      >
                        Got it!
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8 overflow-y-auto relative z-10 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`flex gap-4 group ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <motion.div 
                whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${
                  message.role === 'user' ? 'bg-white/5 text-white/70' : 'bg-indigo-500/10 text-indigo-400'
                }`}
              >
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </motion.div>
              
              <div className={`flex flex-col max-w-[80%] relative ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <motion.div 
                  layout
                  className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed relative group/bubble shadow-lg ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 border-indigo-500/50 text-white rounded-tr-none shadow-indigo-500/10' 
                      : 'bg-[#1a1a1a] border border-white/10 text-white/95 rounded-tl-none'
                  }`}
                >
                  {message.text ? (
                    <div className="markdown-body pr-4">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 py-1">
                      <div className="flex gap-1.5">
                        {[0, 0.2, 0.4].map((delay) => (
                          <motion.span 
                            key={delay}
                            animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay }}
                            className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400/60 font-bold">Thinking...</span>
                    </div>
                  )}

                  {message.role === 'model' && message.text && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(message.text, message.id)}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all border backdrop-blur-sm ${
                        copiedId === message.id 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 opacity-100' 
                          : 'text-white/20 bg-white/5 border-white/10 hover:text-white/60 hover:border-white/20 md:opacity-0 md:group-hover/bubble:opacity-100 opacity-100'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                    </motion.button>
                  )}
                </motion.div>
                <div className="flex items-center gap-3 mt-2 px-2">
                  <span className="text-[9px] uppercase tracking-widest text-white/20 font-mono">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input */}
      <footer className="pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 relative z-20">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-28 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none min-h-[60px] max-h-[144px] text-white placeholder:text-white/20 font-mono custom-scrollbar"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all border ${
                isListening 
                  ? 'text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'text-white/40 bg-white/5 border-white/10 hover:text-indigo-400 hover:border-indigo-500/30'
              }`}
              title={isListening ? "Stop Voice" : "Voice Input"}
            >
              {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all border ${
                !input.trim() || isLoading 
                  ? 'text-white/20 bg-white/5 border-white/5' 
                  : 'text-white bg-indigo-600 border-indigo-500 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
              }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}
