import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1 Google Maps Platform quota and auth failure detection
(window as Window & {gm_authFailure?: () => void}).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

const root = createRoot(document.getElementById('root')!);
if (window.location.pathname.replace(/\/$/, '') === '/motion-prototype') {
  const fallbackClass = 'grid min-h-dvh place-items-center bg-[#f4f7f6] p-6 text-center text-sm font-semibold text-[#24694f]';
  root.render(<main role="status" className={fallbackClass}><p>Loading design prototype…</p></main>);
  void import('./prototype/Workspace').then(({ Workspace }) => root.render(<Workspace />), () => {
    root.render(<main role="alert" className={fallbackClass}><p>The prototype could not load. Refresh to try again.</p></main>);
  });
} else {
  root.render(<App />);
}
