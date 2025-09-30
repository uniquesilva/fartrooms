'use client';

import { useEffect, useRef } from 'react';

interface BackgroundAudioProps {
  enabled: boolean;
}

export default function BackgroundAudio({ enabled }: BackgroundAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (enabled) {
        audioRef.current.volume = 0.1; // Very low volume
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors (browsers block autoplay)
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [enabled]);

  return (
    <audio
      ref={audioRef}
      src="/fart1.mp3"
      preload="auto"
      loop
      style={{ display: 'none' }}
    />
  );
}
