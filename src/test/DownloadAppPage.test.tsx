import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DownloadAppPage from '@/pages/DownloadAppPage';

describe('DownloadAppPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the download page in a browser and provides install instructions when needed', () => {
    render(
      <MemoryRouter initialEntries={['/download']}>
        <DownloadAppPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /كل خدمات الوجيه/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'تحميل التطبيق' }));
    expect(screen.getByRole('status')).toHaveTextContent('لتثبيت التطبيق على Android');
  });

  it('redirects to the app home when opened in standalone mode', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    render(
      <MemoryRouter initialEntries={['/download']}>
        <Routes>
          <Route path="/download" element={<DownloadAppPage />} />
          <Route path="/home" element={<p>App home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('App home')).toBeInTheDocument();
  });
});
