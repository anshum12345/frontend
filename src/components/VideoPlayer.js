import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import styled from 'styled-components';
import { checkBackendStatus } from '../services/api';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
`;

const StatusMessage = styled.div`
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
  ${props => props.type === 'error' && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
  ${props => props.type === 'loading' && `
    background: #e2e3e5;
    color: #383d41;
    border: 1px solid #d6d8db;
  `}
  ${props => props.type === 'success' && `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}
`;

const VideoPlayer = ({ url }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const updateStatus = (type, message) => {
    setStatus({ type, message });
  };

  const initializePlayer = useCallback(async () => {
    if (!url) {
      updateStatus('error', 'No stream URL provided');
      return;
    }

    updateStatus('loading', 'Initializing stream...');
    setRetryCount(0);

    try {
      // Check backend status first
      const backendStatus = await checkBackendStatus();
      if (backendStatus.error) {
        throw new Error('Backend service unavailable');
      }

      let hls;
      const video = videoRef.current;

      // Clean up previous instance if exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          enableWorker: true,
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          updateStatus('loading', 'Loading stream source...');
          hls.loadSource(`http://localhost:5001/stream/${encodeURIComponent(url)}`);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          updateStatus('success', 'Stream ready');
          if (playing) {
            video.play().catch(e => {
              updateStatus('error', 'Autoplay blocked. Click play to start.');
              setPlaying(false);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (retryCount < 3) {
                  updateStatus('loading', `Network error. Retrying... (${retryCount + 1}/3)`);
                  setTimeout(() => {
                    setRetryCount(c => c + 1);
                    hls.startLoad();
                  }, 2000 * (retryCount + 1));
                } else {
                  updateStatus('error', 'Failed to connect after multiple attempts');
                  hls.destroy();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                updateStatus('loading', 'Recovering media error...');
                hls.recoverMediaError();
                break;
              default:
                updateStatus('error', 'Fatal playback error');
                hls.destroy();
                break;
            }
          }
        });

        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = `http://localhost:5001/stream/${encodeURIComponent(url)}`;
        video.addEventListener('loadedmetadata', () => {
          updateStatus('success', 'Stream ready');
          if (playing) video.play();
        });
      } else {
        throw new Error('HLS is not supported in this browser');
      }
    } catch (err) {
      updateStatus('error', err.message);
    }
  }, [url, retryCount, playing]);

  useEffect(() => {
    initializePlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initializePlayer]);

  const handlePlayPause = () => {
    if (status.type === 'error') {
      initializePlayer();
      return;
    }

    const newPlayingState = !playing;
    setPlaying(newPlayingState);

    if (newPlayingState && videoRef.current) {
      videoRef.current.play().catch(e => {
        updateStatus('error', 'Playback failed. Please try again.');
        setPlaying(false);
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <PlayerContainer>
      <video
        ref={videoRef}
        controls={false}
        width="100%"
        muted={volume === 0}
        onClick={handlePlayPause}
        style={{ cursor: 'pointer' }}
      />
      
      <Controls>
        <button 
          onClick={handlePlayPause}
          disabled={status.type === 'loading'}
        >
          {status.type === 'error' ? 'Retry' : 
           status.type === 'loading' ? 'Loading...' : 
           playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          disabled={status.type !== 'success'}
        />
        <span>Volume: {Math.round(volume * 100)}%</span>
      </Controls>

      {status.type !== 'idle' && (
        <StatusMessage type={status.type}>
          {status.message}
          {status.type === 'error' && (
            <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
              <button 
                onClick={initializePlayer}
                style={{ 
                  padding: '4px 8px',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              >
                Retry Connection
              </button>
            </div>
          )}
        </StatusMessage>
      )}
    </PlayerContainer>
  );
};

export default VideoPlayer;