export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: InstallPromptEvent;
  }
}

type InstallPromptListener = (event: InstallPromptEvent | null) => void;

let deferredInstallEvent: InstallPromptEvent | null = null;
const listeners = new Set<InstallPromptListener>();

export function captureInstallPrompt(event: InstallPromptEvent) {
  event.preventDefault();
  deferredInstallEvent = event;
  listeners.forEach(listener => listener(deferredInstallEvent));
}

export function subscribeToInstallPrompt(listener: InstallPromptListener) {
  listeners.add(listener);
  listener(deferredInstallEvent);
  return () => listeners.delete(listener);
}

export async function promptToInstall() {
  if (!deferredInstallEvent) return null;

  const installEvent = deferredInstallEvent;
  deferredInstallEvent = null;
  listeners.forEach(listener => listener(null));

  await installEvent.prompt();
  return installEvent.userChoice;
}
