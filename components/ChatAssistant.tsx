import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Minimize2, Terminal } from 'lucide-react';
import { ChatMessage, GitHubRepo } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatAssistantProps {
  contextRepo: GitHubRepo | null;
  onClearContext: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ contextRepo, onClearContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', content: 'Hi! I can help you debug code or find the perfect repo. Ask me anything!', timestamp: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-open if context is added
  useEffect(() => {
    if (contextRepo) {
      setIsOpen(true);
      setIsMinimized(false);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'model', 
          content: `I see you're looking at **${contextRepo.full_name}**. Need help installing it or understanding the code?`, 
          timestamp: Date.now() 
        }
      ]);
    }
  }, [contextRepo]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let contextStr = "";
    if (contextRepo) {
      contextStr = `Repository: ${contextRepo.full_name}\nDescription: ${contextRepo.description}\nLanguage: ${contextRepo.language}\nStars: ${contextRepo.stargazers_count}`;
    }

    try {
      const responseText = await sendChatMessage(
        messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
        contextStr
      );
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: responseText, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, connection error.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-black border-2 border-primary hover:bg-white hover:border-black brutal-shadow flex items-center justify-center transition-all z-50"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 w-72 bg-surface border-2 border-border brutal-shadow z-50">
        <div className="p-3 bg-primary text-black flex justify-between items-center cursor-pointer border-b-2 border-primary" onClick={() => setIsMinimized(false)}>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <Terminal size={18} /> GitScout Assistant
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white transition-colors"><X size={18} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-background border-2 border-border brutal-shadow flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Header */}
      <div className="p-4 bg-surface border-b-2 border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-black border-2 border-primary brutal-shadow-sm">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text uppercase tracking-wider text-sm">GitScout Assistant</h3>
            <p className="text-[10px] font-mono text-secondary flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 border border-green-700 animate-pulse"></span> ONLINE
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-secondary">
          <button onClick={() => setIsMinimized(true)} className="p-2 hover:text-primary hover:bg-surface border-2 border-transparent hover:border-border transition-all brutal-shadow-sm"><Minimize2 size={18} /></button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:text-red-500 hover:bg-surface border-2 border-transparent hover:border-border transition-all brutal-shadow-sm"><X size={18} /></button>
        </div>
      </div>

      {/* Context Banner */}
      {contextRepo && (
        <div className="px-4 py-3 bg-primary text-black border-b-2 border-border flex justify-between items-center">
          <span className="text-xs font-mono font-bold truncate max-w-[250px]">CONTEXT: {contextRepo.name}</span>
          <button onClick={onClearContext} className="text-black hover:text-white transition-colors"><X size={16}/></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-background" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 border-2 brutal-shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-black border-primary' 
                : 'bg-surface text-text border-border'
            }`}>
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
      </div>

      {/* Input */}
      <div className="p-4 bg-surface border-t-2 border-border">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
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

export default ChatAssistant;