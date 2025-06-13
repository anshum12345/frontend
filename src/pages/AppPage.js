import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';
import OverlayComponent from '../components/OverlayComponent';
import OverlayEditor from '../components/OverlayEditor';

const AppPage = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [overlays, setOverlays] = useState([]);
  const [activeOverlay, setActiveOverlay] = useState(null);

  useEffect(() => {
    fetchOverlays();
  }, []);

  const fetchOverlays = async () => {
    try {
      const response = await axios.get('/api/overlays');
      setOverlays(response.data);
    } catch (error) {
      console.error('Error fetching overlays:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStreamUrl(inputUrl);
  };

  const handleOverlayAdded = (overlay) => {
    setOverlays(prev => [...prev, overlay]);
  };

  const handleOverlayUpdated = (id, updatedOverlay) => {
    setOverlays(prev => prev.map(overlay => 
      overlay._id === id ? { ...overlay, ...updatedOverlay } : overlay
    ));
  };

  const handleOverlayDeleted = (id) => {
    setOverlays(prev => prev.filter(overlay => overlay._id !== id));
    if (activeOverlay === id) {
      setActiveOverlay(null);
    }
  };

  const handleOverlayPositionChange = async (id, x, y) => {
    try {
      await axios.put(`/api/overlays/${id}`, { x, y });
      setOverlays(prev => prev.map(overlay => 
        overlay._id === id ? { ...overlay, x, y } : overlay
      ));
    } catch (error) {
      console.error('Error updating overlay position:', error);
    }
  };

  return (
    <div>
      <h1>Livestream App</h1>
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

      <div style={{ position: 'relative', maxWidth: '800px', margin: '20px auto' }}>
        {streamUrl && <VideoPlayer url={streamUrl} />}
        {overlays.map(overlay => (
          <OverlayComponent
            key={overlay._id}
            overlay={overlay}
            active={activeOverlay === overlay._id}
            onClick={() => setActiveOverlay(overlay._id)}
            onStop={(e, data) => handleOverlayPositionChange(overlay._id, data.x, data.y)}
          />
        ))}
      </div>

      <OverlayEditor
        overlays={overlays}
        onOverlayAdded={handleOverlayAdded}
        onOverlayUpdated={handleOverlayUpdated}
        onOverlayDeleted={handleOverlayDeleted}
      />
    </div>
  );
};

export default AppPage;