import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Extend Window interface for Google Translate
declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            layout: number;
          },
          id: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslate() {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`translate_input_${Date.now()}`);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset for reinitialization on language change
    initializedRef.current = false;
    containerRef.current.innerHTML = '';

    // Set the ID on the container
    containerRef.current.id = idRef.current;

    let retries = 0;
    const maxRetries = 100;

    const interval = setInterval(() => {
      if (window.google?.translate?.TranslateElement) {
        try {
          // Layout options: 0 = Simple, 1 = Horizontal, 2 = Vertical
          new window.google.translate.TranslateElement(
            {
              pageLanguage: i18n.language,
              layout: 1, // Horizontal layout
            },
            idRef.current
          );
          initializedRef.current = true;
          clearInterval(interval);

          // Force inline layout after widget renders — Google's external
          // stylesheet sets img { display: block } with high specificity
          // that CSS !important alone can't override, so we patch inline styles.
          setTimeout(() => {
            const gadget = containerRef.current?.querySelector('.goog-te-gadget');
            if (gadget) {
              (gadget as HTMLElement).style.cssText = 'white-space:nowrap;font-size:13px;color:#666;font-family:arial,sans-serif;';
              const img = gadget.querySelector('img');
              if (img) img.style.cssText += 'display:inline!important;vertical-align:middle;';
              const combo = gadget.querySelector('.goog-te-combo') as HTMLElement | null;
              if (combo) combo.style.cssText += 'border:1px solid #ccc!important;border-radius:2px;padding:4px 8px;margin-right:12px;font-size:13px;';
            }
          }, 100);
        } catch (error) {
          console.error('Error initializing Google Translate:', error);
          clearInterval(interval);
        }
      } else {
        retries += 1;
        if (retries > maxRetries) {
          console.error('Could not load Google Translate');
          clearInterval(interval);
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [i18n.language]);

  return (
    <div ref={containerRef} className="pl-4">
      <style>{`
        /* Style Google Translate widget – single horizontal line */
        .goog-te-gadget {
          white-space: nowrap !important;
          font-size: 13px !important;
          color: #666 !important;
          font-family: arial, sans-serif !important;
          line-height: normal !important;
        }

        .goog-te-gadget * {
          display: inline !important;
          vertical-align: middle !important;
          white-space: nowrap !important;
        }

        .goog-te-combo {
          display: inline-block !important;
          border: 1px solid #999 !important;
          border-radius: 2px !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          background-color: white !important;
          margin-right: 12px !important;
        }

        .goog-te-gadget img,
        .goog-te-gadget a img,
        .VIpgJd-ZVi9od-l4eHX-hSRGPd img {
          display: inline !important;
          height: 14px !important;
          width: auto !important;
          vertical-align: middle !important;
          margin: 0 2px !important;
        }

        .goog-te-gadget a {
          font-size: 13px !important;
          color: #666 !important;
          text-decoration: none !important;
        }

        /* Hide the Google Translate banner */
        .goog-te-banner-frame {
          display: none !important;
        }

        body {
          top: 0 !important;
        }
      `}</style>
    </div>
  );
}
