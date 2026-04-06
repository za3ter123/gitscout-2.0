import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles, SlidersHorizontal, ArrowRight, X, Shuffle, Terminal } from 'lucide-react';
import { GitHubRepo, SearchFilters } from './types';
import { optimizeSearchQuery } from './services/geminiService';
import { searchGitHub } from './services/githubService';
import RepoCard from './components/RepoCard';
import ChatAssistant from './components/ChatAssistant';
import FilterBar from './components/FilterBar';
import { motion, AnimatePresence } from 'motion/react';

const GitScoutLogo = ({ className = "", size = 64 }) => (
  <Terminal size={size} className={className} strokeWidth={2} />
);

const App: React.FC = () => {
  // State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GitHubRepo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [optimizedQuery, setOptimizedQuery] = useState('');
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeChatRepo, setActiveChatRepo] = useState<GitHubRepo | null>(null);

  const randomQueries = [
    "React portfolio template",
    "Python web scraper",
    "Machine learning model",
    "Next.js dashboard",
    "Rust CLI tool",
    "Go microservice",
    "Vue e-commerce",
    "Node.js REST API",
    "iOS weather app",
    "Android chat app"
  ];

  const handleRandomQuery = () => {
    const random = randomQueries[Math.floor(Math.random() * randomQueries.length)];
    setQuery(random);
  };

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    language: '',
    minStars: 0,
    sort: 'best-match',
    order: 'desc',
    safetyRating: undefined,
    os: ''
  });

  // Race Condition Handling
  const requestIdRef = useRef(0);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    setIsSearching(true);
    setLoading(true);
    setError('');
    setOptimizedQuery('');
    setDismissedSuggestion(false);
    
    // Increment request ID
    const currentId = ++requestIdRef.current;

    try {
      const data = await searchGitHub(activeQuery, filters);
      
      if (currentId !== requestIdRef.current) return;

      let fetchedResults = data.items || [];

      if (filters.safetyRating && filters.safetyRating > 0) {
         fetchedResults = fetchedResults.filter(repo => {
            const mockScore = Math.min(10, Math.max(1, Math.round(Math.log10((repo.stargazers_count / (repo.open_issues_count + 1)) + 1) * 3)));
            return mockScore >= filters.safetyRating!;
         });
      }

      setResults(fetchedResults);
      setTotalCount(data.total_count || 0);
      
      if (fetchedResults.length === 0) {
        setError("No results found matching your criteria.");
      }

      if (!overrideQuery) {
        try {
          const aiQuery = await optimizeSearchQuery(activeQuery);
          if (currentId === requestIdRef.current && aiQuery && aiQuery !== activeQuery) {
            setOptimizedQuery(aiQuery);
          }
        } catch (err) {
          console.warn("Optimization failed");
        }
      }

    } catch (err: any) {
      if (currentId !== requestIdRef.current) return;
      setError(err.message || "Something went wrong.");
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const acceptSuggestion = () => {
    setQuery(optimizedQuery);
    handleSearch(undefined, optimizedQuery);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary selection:text-black">
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Navigation / Header - visible when searching */}
        <AnimatePresence>
          {isSearching && (
            <motion.header 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="sticky top-0 bg-background/90 backdrop-blur-md border-b-2 border-border z-40 px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setIsSearching(false); setQuery(''); setResults([]); }}>
                <div className="bg-primary text-black p-1.5 brutal-shadow">
                  <GitScoutLogo size={20} />
                </div>
                <span className="font-bold text-xl tracking-tight uppercase">GitScout</span>
              </div>
              
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8 relative flex items-center">
                <Search size={18} className="absolute left-4 text-secondary" />
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-surface border-2 border-border py-3 pl-12 pr-20 text-sm text-text font-mono focus:border-primary focus:outline-none transition-colors brutal-shadow"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  {query && (
                    <button 
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-secondary hover:text-primary transition-colors"
                      title="Clear"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={handleRandomQuery}
                    className="text-secondary hover:text-primary transition-colors"
                    title="Random Search"
                  >
                    <Shuffle size={16} />
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFiltersOpen(!filtersOpen)} 
                  className={`flex items-center gap-2 px-4 py-2 border-2 transition-all brutal-shadow font-bold uppercase text-sm ${filtersOpen ? 'bg-primary text-black border-primary' : 'bg-surface border-border hover:border-primary text-text'}`}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Filter Bar (Expandable) - Searching State */}
        <AnimatePresence>
          {isSearching && filtersOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-surface border-b-2 border-border z-30 relative"
            >
              <div className="max-w-7xl mx-auto py-6">
                 <FilterBar filters={filters} onChange={setFilters} />
                 <div className="px-6 mt-6 flex justify-end">
                     <button 
                      onClick={() => handleSearch()}
                      className="bg-primary text-black px-6 py-3 font-bold uppercase tracking-wider text-sm brutal-shadow border-2 border-primary hover:bg-white transition-colors flex items-center gap-2"
                    >
                      Apply & Search <ArrowRight size={16} />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Search (Initial State) */}
        {!isSearching && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="w-full max-w-3xl flex flex-col items-center"
            >
              <motion.div variants={itemVariants} className="bg-primary text-black p-4 brutal-shadow mb-8 border-2 border-primary">
                <GitScoutLogo size={80} />
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black text-text tracking-tighter text-center uppercase leading-none mb-6">
                Git<span className="text-primary">Scout</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-secondary mt-2 text-xl font-mono text-center max-w-xl mb-12">
                &gt; The AI-powered search engine for the GitHub universe. Finds what others miss._
              </motion.p>

              <motion.form variants={itemVariants} onSubmit={handleSearch} className="w-full relative group">
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for repositories, e.g. React portfolio..."
                  className="w-full bg-surface border-2 border-border py-5 pl-16 pr-40 text-xl font-mono text-text placeholder:text-border brutal-shadow focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <Search size={24} className="absolute left-6 top-5 text-secondary" />
                <div className="absolute right-16 top-5 flex items-center gap-3 z-10">
                  {query && (
                    <button 
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-secondary hover:text-primary transition-colors"
                      title="Clear"
                    >
                      <X size={20} />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={handleRandomQuery}
                    className="text-secondary hover:text-primary transition-colors"
                    title="Random Search"
                  >
                    <Shuffle size={20} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`transition-colors ${filtersOpen ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                    title="Filters"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                </div>
                <button type="submit" className="absolute right-3 top-3 bg-primary text-black p-2 border-2 border-primary brutal-shadow hover:bg-white transition-colors z-10">
                  <ArrowRight size={24} />
                </button>
              </motion.form>

              {/* Filter Bar (Expandable) - Initial State */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full z-40"
                  >
                    <div className="pt-6">
                      <FilterBar filters={filters} onChange={setFilters} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Chips */}
              <motion.div variants={itemVariants} className="mt-12 flex flex-wrap gap-3 justify-center">
                {["Dashboard template", "Python web scraper", "React portfolio", "Machine learning model"].map((term) => (
                  <button 
                    key={term}
                    onClick={() => { setQuery(term); handleSearch(); }}
                    className="px-4 py-2 bg-surface border-2 border-border text-sm font-mono text-secondary hover:text-primary hover:border-primary brutal-shadow transition-all"
                  >
                    {term}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Results Area */}
        {isSearching && (
          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
            
            {/* AI Feedback */}
            <AnimatePresence>
              {optimizedQuery && !dismissedSuggestion && !loading && !error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12 bg-surface border-2 border-primary p-6 brutal-shadow flex flex-col sm:flex-row items-start sm:items-center gap-6"
                >
                  <div className="bg-primary text-black p-3 border-2 border-primary">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-text font-bold text-xl uppercase tracking-tight mb-2">
                      AI Search Optimization
                    </h3>
                    <p className="text-secondary font-mono text-sm">
                      &gt; We optimized your query to find better results: <span className="text-primary bg-primary/10 px-2 py-1 border border-primary/30">{optimizedQuery}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <button 
                      onClick={() => setDismissedSuggestion(true)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-surface border-2 border-border text-secondary hover:text-text hover:border-secondary brutal-shadow font-bold uppercase text-sm transition-all"
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={acceptSuggestion}
                      className="flex-1 sm:flex-none px-6 py-3 bg-primary border-2 border-primary text-black hover:bg-white brutal-shadow font-bold uppercase text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      Search Instead <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {loading && (
              <div className="animate-pulse">
                <div className="h-6 w-64 bg-border mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-surface border-2 border-border p-6 h-64 flex flex-col">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-border" />
                        <div className="space-y-3 flex-1">
                          <div className="h-5 w-full bg-border" />
                          <div className="h-4 w-2/3 bg-border" />
                        </div>
                      </div>
                      <div className="space-y-3 mt-2">
                        <div className="h-4 w-full bg-border" />
                        <div className="h-4 w-4/5 bg-border" />
                      </div>
                      <div className="mt-auto flex gap-4">
                        <div className="h-5 w-16 bg-border" />
                        <div className="h-5 w-16 bg-border" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="bg-red-500 text-black p-6 border-2 border-red-500 brutal-shadow mb-8">
                  <Terminal size={64} />
                </div>
                <h3 className="text-4xl font-black text-text uppercase tracking-tighter mb-4">Error 404</h3>
                <p className="text-secondary font-mono text-lg max-w-md mb-10">&gt; {error}</p>
                <button 
                  onClick={() => { setQuery(''); setError(''); setIsSearching(false); }}
                  className="px-8 py-4 bg-surface border-2 border-border text-text hover:border-primary brutal-shadow font-bold uppercase tracking-wider flex items-center gap-3 transition-all"
                >
                  <ArrowRight size={20} className="rotate-180" /> Back to Terminal
                </button>
              </motion.div>
            )}

            {/* Grid */}
            {!loading && !error && results.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <div className="flex justify-between items-end mb-8 border-b-2 border-border pb-4">
                  <h2 className="text-3xl font-black uppercase tracking-tight">Results</h2>
                  <p className="text-sm text-primary font-mono font-bold">&gt; {totalCount.toLocaleString()} found_</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                  {results.map((repo) => (
                    <motion.div key={repo.id} variants={itemVariants}>
                      <RepoCard 
                        repo={repo} 
                        onChatContext={(r) => setActiveChatRepo(r)} 
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </main>
        )}
      </div>

      <ChatAssistant 
        contextRepo={activeChatRepo} 
        onClearContext={() => setActiveChatRepo(null)} 
      />
    </div>
  );
};

export default App;