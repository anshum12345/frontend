import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';

const LandingPage = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStreamUrl(inputUrl);
  };

  return (
    <div>
      <h1>Livestream Viewer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter RTSP URL (e.g., rtsp://example.com/stream)"
          required
        />
        <button type="submit">Load Stream</button>
      </form>
      {streamUrl && <VideoPlayer url={streamUrl} />}
    </div>
  );
};

export default LandingPage;