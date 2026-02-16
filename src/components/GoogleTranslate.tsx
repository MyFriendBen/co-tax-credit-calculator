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
    if (!containerRef.current || initializedRef.current) return;

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
        /* Style Google Translate widget to match original */
        .goog-te-combo {
          border: 1px solid #ccc !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          font-size: 14px !important;
          background-color: white !important;
        }

        .goog-te-gadget {
          font-size: 0 !important;
          line-height: 1 !important;
        }

        .goog-te-gadget > span {
          display: inline-block !important;
          vertical-align: middle !important;
        }

        .goog-te-gadget > span:first-child {
          font-size: 14px !important;
          margin-right: 8px !important;
        }

        .goog-te-gadget .goog-te-combo {
          margin: 0 8px 0 0 !important;
          vertical-align: middle !important;
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
