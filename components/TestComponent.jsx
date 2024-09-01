import React, { useState } from 'react';
import axios from 'axios';

function TestComponent() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('latexFile', file);

    try {
      const response = await axios.post('http://localhost:5001/api/latex-to-pdf', formData, {
        responseType: 'blob',
      });
      // Handle successful response
      console.log('PDF received:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".tex" />
      <button type="submit">Test API</button>
    </form>
  );
}
