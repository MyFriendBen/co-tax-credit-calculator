import { useEffect, useRef } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calculator } from './components/Calculator';
import logoImage from 'figma:asset/bcb4bcc792026e32409a116890b8a8dbe5d758d4.png';

function CalculatorWrapper() {
  const { whiteLabel, lang } = useParams<{ whiteLabel: string; lang: string }>();
  const { i18n } = useTranslation();
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Update language when route parameter changes
  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'es')) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    const TARGET_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN ?? '*';

    let rafId: number | null = null;

    function getHeight() {
      const el = contentRef.current;
      if (el) return el.scrollHeight;

      const scrollingEl = document.scrollingElement || document.documentElement;
      return scrollingEl.scrollHeight;
    }

    function sendHeight() {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const height = getHeight();

        window.parent.postMessage(
          { type: 'IFRAME_HEIGHT', height },
          TARGET_ORIGIN
        );
      });
    }

    // Initial
    sendHeight();

    const el = contentRef.current;

    const ro = new ResizeObserver(() => {
      // Two sends helps in cases where layout settles one frame later
      sendHeight();
      setTimeout(sendHeight, 0);
    });

    if (el) ro.observe(el);

    window.addEventListener('resize', sendHeight);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, []);

  return (
    <div ref={contentRef}>
      <main className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <Calculator />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/:whiteLabel/:lang" element={<CalculatorWrapper />} />
      <Route path="/" element={<Navigate to={`/${import.meta.env.VITE_DEFAULT_WHITE_LABEL ?? 'gac'}/en`} replace />} />
    </Routes>
  );
}
