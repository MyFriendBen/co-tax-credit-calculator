/**
 * White label configuration and link utilities
 * Ported from the original Svelte implementation
 */

export type WhiteLabel =
  | 'gac'
  | 'pueblo_united_way'
  | 'dabc'
  | 'alg'
  | 'servicios'
  | 'jeffco'
  | 'adams'
  | 'arapahoe'
  | '211colorado';

/**
 * Get the in-person filing link for a specific white label
 * Used by the File In-Person Quiz outcomes
 */
export function getFileInPersonLink(whiteLabel?: string): string {
  switch (whiteLabel) {
    case 'alg':
      return 'https://forms.gle/uimtJcuYqSKWiPp19';
    case 'pueblo_united_way':
      return 'https://www.pueblounitedway.org/vita#file-in-person';
    case 'dabc':
      return 'https://denverabc.org/schedule/';
    case '211colorado':
      return 'https://search.211colorado.org/search?terms=aarp%20tax%20aide&page=1&location=Colorado&taxonomy_code=332&service_area=colorado';
    default:
      // Get Ahead Colorado and all others
      return 'https://www.getaheadcolorado.org/fileinperson/?utm_source=get_ahead&utm_medium=online&utm_campaign=calculator_logic_button_click';
  }
}

/**
 * Get Your Refund - online filing with VITA volunteer support
 */
export function getOnlineWithSupportLink(): string {
  return 'https://www.getyourrefund.org/en/sign-up';
}

/**
 * Get Your Refund DIY - optimized self-filing
 */
export function getDiyFilingLink(): string {
  return 'https://www.getyourrefund.org/en/diy/file_yourself';
}

/**
 * FreeTaxUSA - $16-$61 filing option
 */
export function getFreeTaxUsaLink(): string {
  return 'https://www.freetaxusa.com/';
}

/**
 * MyFreeTaxes - free online filing
 */
export function getMyFreeTaxesLink(): string {
  return 'https://myfreetaxes.com/';
}

/**
 * Paid filing options page on MFB
 */
export function getPaidFilingOptionsLink(lang: string = 'en'): string {
  const baseUrl =
    lang === 'es'
      ? 'https://co.myfriendben.org/opciones-de-presentacion-de-impuestos-pagados/'
      : 'https://co.myfriendben.org/paid-tax-filing-options/';

  return `${baseUrl}?utm_source=online&utm_medium=calculator&utm_campaign=paid_filing_options&utm_id=get_ahead&utm_term=${lang === 'es' ? 'spanish' : 'english'}&utm_content=mfb_page`;
}

/**
 * Gets the current Google Translate target language from the googtrans cookie.
 * The cookie format is "/sourceLang/targetLang" (e.g., "/en/es").
 * Returns null if no Google Translate language is selected.
 */
export function getGoogleTranslateLanguage(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie.split('; ').find((row) => row.startsWith('googtrans='));

  if (!cookie) return null;

  const value = decodeURIComponent(cookie.split('=')[1]);
  // Format is "/en/es" - we want the target language (second part)
  const parts = value.split('/').filter(Boolean);
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Generate Savings Collaborative link with language parameter
 * Checks Google Translate language first, then falls back to app locale
 */
export function generateSavingsCollaborativeLink(lang: string): string {
  // Check for Google Translate language first, fall back to app locale
  const googleTranslateLang = getGoogleTranslateLanguage();
  const effectiveLang = googleTranslateLang || lang;
  return `https://taxrefund.savingscollaborative.org/?lang=${effectiveLang}`;
}
