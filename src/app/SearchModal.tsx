"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchModal({ articles }: { articles: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Collect all unique tags
  const allTags = Array.from(new Set(
    articles.flatMap(article => (article.tags || "").split(',').map((tag: string) => tag.trim()).filter(Boolean))
  ));

  // Filter tags based on search term (case-insensitive)
  const filterTags = (term: string) => {
    if (!term) {
      setFilteredTags([]);
      return;
    }
    const lowerCaseTerm = term.toLowerCase();
    const results = allTags.filter(tag => tag.toLowerCase().includes(lowerCaseTerm));
    setFilteredTags(results);
  };


  // Open search modal on '/' key press, clear filter on '=' key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '/' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
        setSearchTerm('');
        setFilteredTags([]);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (event.key === '=' && !isOpen) {
        // Clear filter and show all articles
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        params.delete('q');
        router.replace(`?${params.toString()}`);
      } else if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        setFilteredTags([]);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterTags(term);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.replace(`?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    setIsOpen(false);
    setSearchTerm(tag);
    setFilteredTags([]);
    // Set the tag as the search param to filter the main page
    const params = new URLSearchParams(searchParams);
    params.set('q', tag);
    router.replace(`?${params.toString()}`);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredTags.length > 0) {
        // Use the first filtered tag
        handleTagClick(filteredTags[0]);
      } else if (searchTerm.trim()) {
        // If no filtered tags but user typed something, search for that exact term
        setIsOpen(false);
        const params = new URLSearchParams(searchParams);
        params.set('q', searchTerm.trim());
        router.replace(`?${params.toString()}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mt-20 p-6">
        <div className="flex justify-between items-center mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Type to search tags or tickers (e.g., MVST, Stock Investing)..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleEnter}
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
              setFilteredTags([]);
              router.replace('/');
            }}
            className="ml-4 p-2 text-gray-600 hover:text-gray-900"
          >
            X
          </button>
        </div>
        {searchTerm && filteredTags.length === 0 && (
          <p className="text-gray-500">No tags found matching "{searchTerm}".</p>
        )}
        {filteredTags.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {filteredTags.map(tag => (
              <li key={tag} className="border-b border-gray-200 last:border-b-0">
                <button
                  onClick={() => handleTagClick(tag)}
                  className="block w-full text-left p-4 hover:bg-gray-100 rounded-md text-blue-700 font-semibold"
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
