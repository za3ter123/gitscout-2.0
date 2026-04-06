import React, { useState, useRef, useEffect } from 'react';
import { SearchFilters } from '../types';
import { Filter, User, Star, Shield, ChevronDown, Check, Code2, ArrowDownUp, Monitor } from 'lucide-react';

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [languageSearch, setLanguageSearch] = useState('');
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (key: keyof SearchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
    setActiveDropdown(null);
  };

  const languages = [
    { value: '', label: 'All Languages' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML/CSS' },
    { value: 'c++', label: 'C++' },
    { value: 'c#', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
  ];

  const sortOptions = [
    { value: 'best-match', label: 'Best Match' },
    { value: 'stars', label: 'Most Stars' },
    { value: 'forks', label: 'Most Forks' },
    { value: 'updated', label: 'Recently Updated' },
    { value: 'oldest', label: 'Oldest to Newest' },
    { value: 'newest', label: 'Newest to Oldest' },
  ];

  const osOptions = [
    { value: '', label: 'All OS' },
    { value: 'mac', label: 'macOS' },
    { value: 'linux', label: 'Linux' },
    { value: 'windows', label: 'Windows' },
  ];

  const minStarsOptions = [
    { value: 0, label: 'Any Stars' },
    { value: 10, label: '10+ Stars' },
    { value: 50, label: '50+ Stars' },
    { value: 100, label: '100+ Stars' },
    { value: 500, label: '500+ Stars' },
    { value: 1000, label: '1k+ Stars' },
    { value: 5000, label: '5k+ Stars' },
    { value: 10000, label: '10k+ Stars' },
  ];

  const safetyRatingOptions = [
    { value: undefined, label: 'Any Rating' },
    { value: 5, label: '5+ / 10' },
    { value: 6, label: '6+ / 10' },
    { value: 7, label: '7+ / 10' },
    { value: 8, label: '8+ / 10' },
    { value: 9, label: '9+ / 10' },
  ];

  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
      setLanguageSearch(''); // Reset search when opening
    }
  };

  const getButtonClass = (isActive: boolean, isDropdownOpen: boolean) => `
    flex items-center justify-between w-full
    border-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 text-left
    ${isActive 
      ? 'bg-primary border-primary text-black brutal-shadow-sm' 
      : 'bg-surface border-border text-text hover:border-primary hover:text-primary brutal-shadow-sm'
    }
    ${isDropdownOpen ? 'border-primary text-primary' : ''}
  `;

  const getDropdownClass = (alignRight = false) => `absolute top-[calc(100%+8px)] ${alignRight ? 'right-0' : 'left-0'} w-full min-w-[240px] bg-surface border-2 border-border brutal-shadow z-50 overflow-hidden animate-in fade-in slide-in-from-top-2`;

  return (
    <div ref={filterBarRef} className="flex flex-col gap-6 p-8 bg-background border-2 border-border brutal-shadow">
      <div className="flex items-center gap-3 text-text border-b-2 border-border pb-4">
        <div className="p-2 bg-primary text-black border-2 border-primary brutal-shadow-sm">
          <Filter size={20} />
        </div>
        <h3 className="text-2xl font-black tracking-tight uppercase">Refine Search</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
        {/* Owner Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Owner / Org</label>
          <div className={`relative flex items-center border-2 px-4 py-3 transition-all duration-200 brutal-shadow-sm ${filters.owner ? 'bg-primary border-primary text-black' : 'bg-surface border-border focus-within:border-primary'}`}>
            <User size={18} className={filters.owner ? "text-black" : "text-secondary"} />
            <input
              type="text"
              placeholder="e.g. facebook"
              value={filters.owner || ''}
              onChange={(e) => onChange({ ...filters, owner: e.target.value })}
              className={`bg-transparent text-sm font-mono focus:outline-none w-full pl-3 ${filters.owner ? 'text-black placeholder:text-black/50' : 'text-text placeholder:text-border'}`}
            />
          </div>
        </div>

        {/* Language Filter */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Language</label>
          <button 
            type="button"
            onClick={() => toggleDropdown('language')}
            className={getButtonClass(filters.language !== '', activeDropdown === 'language')}
          >
            <div className="flex items-center gap-3 truncate">
              <Code2 size={18} className={filters.language !== '' ? "text-black" : "text-secondary"} />
              <span className="truncate">{languages.find(l => l.value === filters.language)?.label || 'All Languages'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${activeDropdown === 'language' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'language' && (
            <div className={getDropdownClass()}>
              <div className="p-3 border-b-2 border-border bg-background">
                <input 
                  type="text"
                  placeholder="Search language..."
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  className="w-full bg-surface border-2 border-border px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-primary transition-all"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleChange('language', lang.value)}
                      className={`w-full text-left px-4 py-3 text-sm font-mono flex items-center justify-between transition-colors border-b border-border/50 last:border-0 ${filters.language === lang.value ? 'bg-primary text-black font-bold' : 'text-text hover:bg-surface hover:text-primary'}`}
                    >
                      {lang.label}
                      {filters.language === lang.value && <Check size={16} />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm font-mono text-secondary text-center">No languages found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Sort By</label>
          <button 
            type="button"
            onClick={() => toggleDropdown('sort')}
            className={getButtonClass(filters.sort !== 'best-match', activeDropdown === 'sort')}
          >
            <div className="flex items-center gap-3 truncate">
              <ArrowDownUp size={18} className={filters.sort !== 'best-match' ? "text-black" : "text-secondary"} />
              <span className="truncate">{sortOptions.find(s => s.value === filters.sort)?.label || 'Best Match'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'sort' && (
            <div className={getDropdownClass()}>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('sort', option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono flex items-center justify-between transition-colors border-b border-border/50 last:border-0 ${filters.sort === option.value ? 'bg-primary text-black font-bold' : 'text-text hover:bg-surface hover:text-primary'}`}
                >
                  {option.label}
                  {filters.sort === option.value && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Min Stars Filter */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Min Stars</label>
          <button 
            type="button"
            onClick={() => toggleDropdown('minStars')}
            className={getButtonClass(filters.minStars > 0, activeDropdown === 'minStars')}
          >
            <div className="flex items-center gap-3 truncate">
              <Star size={18} className={filters.minStars > 0 ? "text-black" : "text-secondary"} />
              <span className="truncate">{minStarsOptions.find(o => o.value === filters.minStars)?.label || 'Any Stars'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${activeDropdown === 'minStars' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'minStars' && (
            <div className={getDropdownClass()}>
              {minStarsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('minStars', option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono flex items-center justify-between transition-colors border-b border-border/50 last:border-0 ${filters.minStars === option.value ? 'bg-primary text-black font-bold' : 'text-text hover:bg-surface hover:text-primary'}`}
                >
                  {option.label}
                  {filters.minStars === option.value && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Safety Rating Filter */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Min Safety</label>
          <button 
            type="button"
            onClick={() => toggleDropdown('safetyRating')}
            className={getButtonClass(filters.safetyRating !== undefined, activeDropdown === 'safetyRating')}
          >
            <div className="flex items-center gap-3 truncate">
              <Shield size={18} className={filters.safetyRating !== undefined ? "text-black" : "text-secondary"} />
              <span className="truncate">{safetyRatingOptions.find(o => o.value === filters.safetyRating)?.label || 'Any Rating'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${activeDropdown === 'safetyRating' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'safetyRating' && (
            <div className={getDropdownClass(true)}>
              {safetyRatingOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleChange('safetyRating', option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono flex items-center justify-between transition-colors border-b border-border/50 last:border-0 ${filters.safetyRating === option.value ? 'bg-primary text-black font-bold' : 'text-text hover:bg-surface hover:text-primary'}`}
                >
                  {option.label}
                  {filters.safetyRating === option.value && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OS Filter */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">OS</label>
          <button 
            type="button"
            onClick={() => toggleDropdown('os')}
            className={getButtonClass(filters.os !== '', activeDropdown === 'os')}
          >
            <div className="flex items-center gap-3 truncate">
              <Monitor size={18} className={filters.os !== '' ? "text-black" : "text-secondary"} />
              <span className="truncate">{osOptions.find(o => o.value === filters.os)?.label || 'All OS'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${activeDropdown === 'os' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'os' && (
            <div className={getDropdownClass(true)}>
              {osOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('os', option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono flex items-center justify-between transition-colors border-b border-border/50 last:border-0 ${filters.os === option.value ? 'bg-primary text-black font-bold' : 'text-text hover:bg-surface hover:text-primary'}`}
                >
                  {option.label}
                  {filters.os === option.value && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FilterBar;