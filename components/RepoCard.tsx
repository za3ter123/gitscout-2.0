import React, { useState } from 'react';
import { Star, GitFork, AlertCircle, Eye, ChevronDown, ChevronUp, Sparkles, Loader2, MessageSquare, ExternalLink, Shield } from 'lucide-react';
import { GitHubRepo, AIRating } from '../types';
import { rateRepository } from '../services/geminiService';

interface RepoCardProps {
  repo: GitHubRepo;
  onChatContext: (repo: GitHubRepo) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, onChatContext }) => {
  const [rating, setRating] = useState<AIRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleRate = async () => {
    if (rating || loading) return;
    setLoading(true);
    try {
      const result = await rateRepository(repo);
      setRating(result);
    } catch (e) {
      alert("Failed to rate repository. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border-2 border-border p-6 hover:border-primary transition-all duration-200 flex flex-col h-full group relative brutal-shadow">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <img src={repo.owner.avatar_url} alt="Owner" className="w-12 h-12 border-2 border-border brutal-shadow-sm" />
          <div>
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="font-bold text-xl text-primary hover:underline line-clamp-1 tracking-tight">
              {repo.name}
            </a>
            <p className="text-sm font-mono text-secondary">@{repo.owner.login}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-base text-text mb-6 line-clamp-3 flex-grow leading-relaxed">
        {repo.description || "No description provided by the author."}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {repo.language && (
          <span className="text-xs font-mono font-bold text-black bg-primary px-2 py-1 border-2 border-primary brutal-shadow-sm uppercase tracking-wider">
            {repo.language}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 text-xs font-mono text-secondary border-t-2 border-border pt-4 mb-6 mt-auto">
        <div className="flex flex-col items-center gap-1 hover:text-primary transition-colors cursor-default" title="Stars">
          <Star size={16} className="text-secondary group-hover:text-primary transition-colors" /> 
          <span className="font-bold">{repo.stargazers_count}</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-primary transition-colors cursor-default" title="Forks">
          <GitFork size={16} className="text-secondary group-hover:text-primary transition-colors" /> 
          <span className="font-bold">{repo.forks_count}</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-primary transition-colors cursor-default" title="Open Issues">
          <AlertCircle size={16} className="text-secondary group-hover:text-primary transition-colors" /> 
          <span className="font-bold">{repo.open_issues_count}</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-primary transition-colors cursor-default" title="Watchers">
          <Eye size={16} className="text-secondary group-hover:text-primary transition-colors" /> 
          <span className="font-bold">{repo.watchers_count}</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-primary transition-colors cursor-default" title="Mock Safety Rating">
          <Shield size={16} className="text-secondary group-hover:text-primary transition-colors" /> 
          <span className="font-bold">{Math.min(10, Math.max(1, Math.round(Math.log10((repo.stargazers_count / (repo.open_issues_count + 1)) + 1) * 3)))}/10</span>
        </div>
      </div>

      {/* AI Rating Section */}
      {!rating ? (
        <button 
          onClick={handleRate}
          disabled={loading}
          className="w-full py-3 bg-surface hover:bg-white text-text hover:text-black font-bold uppercase tracking-wider text-sm border-2 border-border hover:border-black flex items-center justify-center gap-2 transition-all brutal-shadow"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? "Analyzing..." : "AI Rate & Review"}
        </button>
      ) : (
        <div className="bg-background p-4 border-2 border-primary brutal-shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-end mb-4 border-b-2 border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">GitScout Score</span>
            <span className={`text-3xl font-black ${rating.score >= 8 ? 'text-green-500' : rating.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
              {rating.score}<span className="text-sm text-secondary">/10</span>
            </span>
          </div>
          
          <p className="text-sm font-mono italic text-text mb-4">&gt;{rating.summary}_</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2 border-b border-green-500/30 pb-1">Pros</p>
              <ul className="text-xs text-secondary space-y-1 font-mono">
                {rating.pros.slice(0, 2).map((p, i) => <li key={i} className="flex gap-2"><span className="text-green-500">+</span> {p}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 border-b border-red-500/30 pb-1">Cons</p>
              <ul className="text-xs text-secondary space-y-1 font-mono">
                {rating.cons.slice(0, 2).map((c, i) => <li key={i} className="flex gap-2"><span className="text-red-500">-</span> {c}</li>)}
              </ul>
            </div>
          </div>

          {/* Expandable Section */}
          {(rating.useCases.length > 0 || rating.relatedTech.length > 0 || rating.tutorial) && (
            <div className="mt-4">
               {expanded && (
                 <div className="pt-4 border-t-2 border-border space-y-4 mb-4">
                    {rating.tutorial && (
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Quick Start</p>
                        <div className="text-xs font-mono text-secondary bg-surface p-3 border-2 border-border whitespace-pre-line">
                          {rating.tutorial}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Use Cases</p>
                      <div className="flex flex-wrap gap-2">
                        {rating.useCases.map((u, i) => (
                          <span key={i} className="px-2 py-1 bg-surface text-text text-xs border border-border font-mono">{u}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Related Tech</p>
                      <div className="flex flex-wrap gap-2">
                        {rating.relatedTech.map((t, i) => (
                          <span key={i} className="px-2 py-1 bg-surface text-text text-xs border border-border font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                 </div>
               )}
               <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary flex items-center justify-center gap-2 pt-2 border-t-2 border-border"
               >
                 {expanded ? <>Show Less <ChevronUp size={14}/></> : <>Deep Dive <ChevronDown size={14}/></>}
               </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button 
          onClick={() => onChatContext(repo)}
          className="flex-1 py-3 bg-surface hover:bg-primary text-text hover:text-black border-2 border-border hover:border-primary font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all brutal-shadow"
        >
          <MessageSquare size={16} /> Ask AI
        </button>
        <a 
          href={repo.html_url} 
          target="_blank" 
          rel="noreferrer"
          className="py-3 px-6 bg-surface hover:bg-white text-text hover:text-black border-2 border-border hover:border-black font-bold flex items-center justify-center transition-all brutal-shadow"
          title="View on GitHub"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default RepoCard;