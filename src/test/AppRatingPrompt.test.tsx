import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRatingPrompt from '@/components/AppRatingPrompt';

describe('AppRatingPrompt', () => {
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

  it('shows once in standalone mode and saves the selected rating', () => {
    localStorage.setItem('elwageh:show-rating-prompt', '1');
    render(<AppRatingPrompt />);

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '5 نجوم' }));
    fireEvent.click(screen.getByRole('button', { name: 'إرسال التقييم' }));

    expect(localStorage.getItem('elwageh:app-rating')).toBe('5');
    expect(localStorage.getItem('elwageh:show-rating-prompt')).toBeNull();
  });

  it('does not show outside standalone mode or after it has been consumed', () => {
    localStorage.setItem('elwageh:show-rating-prompt', '1');
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
    render(<AppRatingPrompt />);

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
