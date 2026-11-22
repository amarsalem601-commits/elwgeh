import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MobilePermissionsPrompt from '@/components/MobilePermissionsPrompt';

describe('MobilePermissionsPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows on first standalone launch and saves a denied choice', () => {
    localStorage.setItem('elwageh:show-mobile-permissions', '1');
    render(<MobilePermissionsPrompt />);

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'عدم السماح' }));

    expect(localStorage.getItem('elwageh:show-mobile-permissions')).toBeNull();
    expect(JSON.parse(localStorage.getItem('elwageh:mobile-permission-decisions') || '{}')).toEqual({
      location: 'deny',
      camera: 'deny',
      notifications: 'deny',
    });
  });

  it('does not show outside standalone mode', () => {
    localStorage.setItem('elwageh:show-mobile-permissions', '1');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
    render(<MobilePermissionsPrompt />);

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
