import React, { useEffect, useRef } from 'react';

const AppLaunchTone: React.FC = () => {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!window.matchMedia('(display-mode: standalone)').matches) return;

    let audioContext: AudioContext | null = null;

    const playTone = async () => {
      if (hasPlayed.current) return;
      hasPlayed.current = true;

      try {
        audioContext = new AudioContext();
        await audioContext.resume();

        const notes = [523.25, 659.25, 783.99];
        const startedAt = audioContext.currentTime + 0.08;

        notes.forEach((frequency, index) => {
          const oscillator = audioContext!.createOscillator();
          const gain = audioContext!.createGain();
          const noteStart = startedAt + index * 0.09;

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, noteStart);
          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);

          oscillator.connect(gain);
          gain.connect(audioContext!.destination);
          oscillator.start(noteStart);
          oscillator.stop(noteStart + 0.17);
        });

        window.setTimeout(() => {
          void audioContext?.close();
          audioContext = null;
        }, 700);
      } catch {
        hasPlayed.current = false;
      }
    };

    void playTone();

    const playAfterInteraction = () => {
      void playTone();
      window.removeEventListener('pointerdown', playAfterInteraction);
      window.removeEventListener('keydown', playAfterInteraction);
    };

    window.addEventListener('pointerdown', playAfterInteraction);
    window.addEventListener('keydown', playAfterInteraction);

    return () => {
      window.removeEventListener('pointerdown', playAfterInteraction);
      window.removeEventListener('keydown', playAfterInteraction);
      if (audioContext) void audioContext.close();
    };
  }, []);

  return null;
};

export default AppLaunchTone;
