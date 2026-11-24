import React, { useEffect, useRef } from 'react';

const AppLaunchTone: React.FC = () => {
  const hasPlayed = useRef(false);

  useEffect(() => {
    const audio = new Audio('/app-launch.aac');
    let disposed = false;

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', playAfterInteraction);
      window.removeEventListener('keydown', playAfterInteraction);
    };

    const playTone = async () => {
      if (hasPlayed.current) return;

      try {
        await audio.play();
        if (disposed) return;
        hasPlayed.current = true;
        removeInteractionListeners();
      } catch (error) {
        if (error instanceof DOMException && error.name !== 'NotAllowedError') {
          console.error('Unable to play the app launch sound.', error);
        }
      }
    };

    const playAfterInteraction = () => {
      void playTone();
    };

    void playTone();
    window.addEventListener('pointerdown', playAfterInteraction);
    window.addEventListener('keydown', playAfterInteraction);

    return () => {
      disposed = true;
      removeInteractionListeners();
      audio.pause();
    };
  }, []);

  return null;
};

export default AppLaunchTone;
