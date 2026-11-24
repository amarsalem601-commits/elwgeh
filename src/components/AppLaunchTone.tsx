import React, { useEffect, useRef } from 'react';

const AppLaunchTone: React.FC = () => {
  const hasPlayedEntry = useRef(false);

  useEffect(() => {
    const entryAudio = new Audio('/app-launch.wav');
    const followUpAudio = new Audio('/app-launch.aac');
    let disposed = false;
    let isStartingEntry = false;
    let isStartingFollowUp = false;
    let hasStartedFollowUp = false;

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', playAfterInteraction);
      window.removeEventListener('keydown', playAfterInteraction);
    };

    const playFollowUp = async () => {
      if (
        disposed ||
        !hasPlayedEntry.current ||
        !entryAudio.ended ||
        hasStartedFollowUp ||
        isStartingFollowUp
      ) {
        return;
      }

      isStartingFollowUp = true;
      try {
        await followUpAudio.play();
        if (disposed) return;
        hasStartedFollowUp = true;
        removeInteractionListeners();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
          console.error('Unable to play the follow-up app sound.', error);
        }
      } finally {
        isStartingFollowUp = false;
      }
    };

    const playEntry = async () => {
      if (disposed || hasPlayedEntry.current || isStartingEntry) return;

      isStartingEntry = true;
      try {
        await entryAudio.play();
        if (disposed) return;
        hasPlayedEntry.current = true;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
          console.error('Unable to play the app entry sound.', error);
        }
      } finally {
        isStartingEntry = false;
      }
    };

    const playAfterInteraction = () => {
      if (hasPlayedEntry.current) {
        void playFollowUp();
        return;
      }
      void playEntry();
    };

    entryAudio.addEventListener('ended', playFollowUp);
    void playEntry();
    window.addEventListener('pointerdown', playAfterInteraction);
    window.addEventListener('keydown', playAfterInteraction);

    return () => {
      disposed = true;
      removeInteractionListeners();
      entryAudio.removeEventListener('ended', playFollowUp);
      entryAudio.pause();
      followUpAudio.pause();
    };
  }, []);

  return null;
};

export default AppLaunchTone;
