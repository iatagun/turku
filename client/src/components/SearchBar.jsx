import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = React.memo(function SearchBar({ onSearch, placeholder = 'Türkü adı ile ara...' }) {
  const [input, setInput] = useState('');
  const debounced = useDebounce(input, 400);

  useEffect(() => {
    onSearch(debounced);
  }, [debounced, onSearch]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
          <input
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
          />
          {input && (
            <button type="button" className="btn btn-outline" onClick={() => setInput('')}>
              ✕ Temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default SearchBar;
