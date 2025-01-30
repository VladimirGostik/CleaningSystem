import React from 'react';

const SearchInput = ({ onSearch }) => {
  const handleInputChange = (e) => {
    onSearch(e.target.value);
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Vyhľadajte firmu..."
        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        onChange={handleInputChange}
      />
    </div>
  );
};

export default SearchInput;