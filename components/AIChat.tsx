import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Minimize2, Trash2, Code2, Terminal } from 'lucide-react';
import { ChatMessage, GitHubRepo } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  contextRepos: GitHubRepo[];
  onRemoveRepo: (repoId: number) => void;
}

const STORAGE_KEY = 'gitscout_chat_history';

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, contextRepos, onRemoveRepo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse chat history", e);
    }
    return [{ id: 'init', role: 'model', content: 'Hi! I can help you understand repos, debug issues, or explain code. Select repositories to get specific help!', timestamp: Date.now() }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevContextRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isMinimized]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Notify user when context changes
  useEffect(() => {
    if (contextRepos.length > 0) {
      const contextIds = contextRepos.map(r => r.id).sort().join(',');
      
      if (prevContextRef.current !== contextIds) {
        const names = contextRepos.map(r => r.name).join(', ');
        const contextMsg = `I see you're interested in: **${names}**. How can I help you compare or analyze these?`;
        
        setMessages(prev => {
           const lastMsg = prev[prev.length - 1];
           if (lastMsg?.content === contextMsg) return prev;
           return [...prev, { id: Date.now().toString(), role: 'model', content: contextMsg, timestamp: Date.now() }];
        });
        
        if (isMinimized) setIsMinimized(false);
        prevContextRef.current = contextIds;
      }
    }
  }, [contextRepos]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }));
      const context = contextRepos.map(r => `Repo: ${r.full_name}\nDesc: ${r.description}`).join('\n---\n');
      
      const response = await sendChatMessage(history, context);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response, timestamp: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, I encountered an error.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      const initialMsg: ChatMessage = { id: Date.now().toString(), role: 'model', content: 'Chat history cleared. How can I help you?', timestamp: Date.now() };
      setMessages([initialMsg]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMsg]));
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-black border-2 border-primary hover:bg-white hover:border-black brutal-shadow flex items-center justify-center transition-all z-50"
      >
        <Terminal size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] md:w-[450px] h-[600px] max-h-[80vh] bg-background border-2 border-border brutal-shadow flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-surface p-4 flex justify-between items-center border-b-2 border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-black border-2 border-primary brutal-shadow-sm">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text uppercase tracking-wider text-sm">GitScout AI</h3>
            <p className="text-[10px] font-mono text-secondary flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 border border-green-700 animate-pulse"></span> ONLINE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-secondary">
          <button 
            onClick={clearChat} 
            className="p-2 hover:text-primary hover:bg-surface border-2 border-transparent hover:border-border transition-all brutal-shadow-sm"
            title="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-2 hover:text-primary hover:bg-surface border-2 border-transparent hover:border-border transition-all brutal-shadow-sm">
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 hover:text-red-500 hover:bg-surface border-2 border-transparent hover:border-border transition-all brutal-shadow-sm">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context Banner */}
      {contextRepos.length > 0 && (
        <div className="bg-surface px-4 py-3 border-b-2 border-border flex flex-col gap-2">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
             <Code2 size={14} />
             <span>Context ({contextRepos.length})</span>
           </div>
           <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
             {contextRepos.map(repo => (
               <div key={repo.id} className="flex items-center gap-2 bg-background border-2 border-border text-text text-xs font-mono px-2 py-1 brutal-shadow-sm">
                 <span className="truncate max-w-[150px]">{repo.name}</span>
                 <button 
                   onClick={() => onRemoveRepo(repo.id)}
                   className="hover:text-red-500 transition-colors"
                 >
                   <X size={12} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 border-2 brutal-shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-black border-primary' 
                  : 'bg-surface text-text border-border'
              }`}
            >
              <div className="prose prose-sm prose-invert max-w-none font-mono text-sm leading-relaxed">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border-2 border-border p-4 flex gap-2 brutal-shadow-sm items-center">
               <span className="w-3 h-3 bg-primary border border-black animate-bounce"></span>
               <span className="w-3 h-3 bg-primary border border-black animate-bounce [animation-delay:0.1s]"></span>
               <span className="w-3 h-3 bg-primary border border-black animate-bounce [animation-delay:0.2s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface border-t-2 border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={contextRepos.length > 0 ? "Ask about these repos..." : "Ask for debugging help..."}
            className="flex-1 bg-background border-2 border-border p-3 text-sm font-mono text-text placeholder:text-secondary focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-primary text-black p-3 border-2 border-primary hover:bg-white hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-all brutal-shadow-sm flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;