/**
 * Supported language codes (must match i18n resources keys)
 */
export const SUPPORTED_LANGUAGES = [
    'zh-CN', 'zh-SG', 'zh-TW', 'zh-HK', 'en', 'fi', 'fr', 'de', 'ru', 'ko', 'jp'
] as const;

export type SupportedLang = typeof SUPPORTED_LANGUAGES[number];

/**
 * Map navigator. Language to supported language code.
 * Returns 'en' when not in browser or when OS language is not supported.
 */
export function getDetectedLanguage(): string {
    if (typeof navigator === 'undefined') return 'en';

    const raw: string = navigator.language || navigator.languages?.[0] || 'en';
    const parts = raw.split('-');
    const lang = parts[0]?.toLowerCase() ?? 'en';
    const region = parts[1]?.toUpperCase();

    // zh variants: zh-SG (Singapore) -> zh-SG; zh-MO (Macau) -> zh-HK (Traditional)
    // zh-TW, zh-HK -> Traditional
    if (lang === 'zh') {
        if (region === 'TW') return 'zh-TW';
        if (region === 'HK' || region === 'MO') return 'zh-HK';
        if (region === 'SG') return 'zh-SG';
        return 'zh-CN';
    }

    // Japanese: navigator uses 'ja', our resource key is 'jp'
    if (lang === 'ja') return 'jp';

    const normalized = region ? `${lang}-${region}` : lang;

    if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLang)) return normalized;

    return SUPPORTED_LANGUAGES.find((l) => l.startsWith(lang)) ?? 'en';
}
