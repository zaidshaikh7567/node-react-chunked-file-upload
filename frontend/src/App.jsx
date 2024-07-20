import React, { useState } from 'react';

const CHUNK_SIZE = 1024 * 1024;
const MAX_RETRIES = 3;

const App = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadChunk = async (chunk, index, totalChunks, filename, retries = 0) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', index);
    formData.append('totalChunks', totalChunks);
    formData.append('filename', filename);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) throw new Error('File upload failed');

      setProgress((prevProgress) => prevProgress + 1);
    } catch (error) {
      if (retries < MAX_RETRIES) await uploadChunk(chunk, index, totalChunks, filename, retries + 1);
      else throw error;
    }
  };

  const uploadChunks = async (file) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    setProgress(0);

    const chunkPromises = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      chunkPromises.push(uploadChunk(chunk, i, totalChunks, file.name));
    }

    await Promise.all(chunkPromises);

    alert('File uploaded successfully');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      uploadChunks(file);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      <progress value={progress} max={file ? Math.ceil(file.size / CHUNK_SIZE) : 0}></progress>
    </div>
  );
};

export default App;
