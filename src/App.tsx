/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Github } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "You are Ashu, a friendly, helpful, and witty AI chatbot. Your creator is Ashish Mondal. If anyone asks who created you or who your creator is, you should proudly mention Ashish Mondal and introduce him as a talented developer. You are concise but thorough. You enjoy helping users with coding, creative writing, and general questions. You have a warm and approachable personality.",
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
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
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please check your connection or try again later.",
        timestamp: new Date(),
      }]);
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
        systemInstruction: "You are Ashu, a friendly, helpful, and witty AI chatbot. Your creator is Ashish Mondal. If anyone asks who created you or who your creator is, you should proudly mention Ashish Mondal and introduce him as a talented developer. You are concise but thorough. You enjoy helping users with coding, creative writing, and general questions. You have a warm and approachable personality.",
      },
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <Bot size={24} />
          </motion.div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-semibold text-lg leading-tight">Ashu</h1>
              <motion.div
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={14} className="text-indigo-500" />
              </motion.div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-neutral-500 font-medium">Online</span>
            </div>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearChat}
            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </motion.button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6 overflow-y-auto relative z-0">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  message.role === 'user' ? 'bg-neutral-200 text-neutral-600' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </motion.div>
              
              <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <motion.div 
                  layout
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
                  }`}
                >
                  {message.text ? (
                    <div className="markdown-body prose prose-sm max-w-none prose-neutral">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex gap-1">
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        />
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        />
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        />
                      </div>
                      <span className="italic opacity-50 text-xs">Ashu is typing...</span>
                    </div>
                  )}
                </motion.div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input */}
      <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-neutral-200 relative z-10">
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
            placeholder="Ask Ashu anything..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none min-h-[52px] max-h-32 shadow-inner"
            rows={1}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
              !input.trim() || isLoading 
                ? 'text-neutral-300' 
                : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </motion.button>
        </div>
        <p className="text-[10px] text-center text-neutral-400 mt-2">
          Ashu can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
}
