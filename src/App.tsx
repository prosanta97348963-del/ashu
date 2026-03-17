/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Github, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Ashu, your friendly AI assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are Ashu, a friendly, helpful, and witty AI assistant. Your creator is Ashish Mondal. If anyone asks who created you or who your creator is, you should proudly mention Ashish Mondal and introduce him as a talented developer. You are concise but thorough. You enjoy helping users with coding, creative writing, and general questions. You have a warm and approachable personality.",
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white relative overflow-hidden">
      {/* Futuristic Atmospheric Background */}
      <div className="atmosphere" />

      {/* Header */}
      <header className="sticky top-0 z-20 glass-panel px-6 py-4 flex items-center justify-between shadow-2xl">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 cursor-pointer border border-white/10"
          >
            <Bot size={28} />
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
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8 overflow-y-auto relative z-10">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <motion.div 
                whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${
                  message.role === 'user' ? 'bg-white/5 text-white/70' : 'bg-indigo-500/10 text-indigo-400'
                }`}
              >
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </motion.div>
              
              <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <motion.div 
                  layout
                  className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed glass-card ${
                    message.role === 'user' 
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-50 rounded-tr-none' 
                      : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                  }`}
                >
                  {message.text ? (
                    <div className="markdown-body">
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
                </motion.div>
                <span className="text-[9px] uppercase tracking-widest text-white/20 mt-2 px-2 font-mono">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input */}
      <footer className="p-6 glass-panel border-t border-white/5 relative z-20">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-28 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none min-h-[60px] max-h-32 text-white placeholder:text-white/20 font-mono"
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
