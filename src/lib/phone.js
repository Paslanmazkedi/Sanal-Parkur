/**
 * Supabase Auth telefon formatı (E.164):
 * - Kayitta: sadece rakam, basinda + yok (ornek: 905551234567)
 * - Dogrulama: /^[1-9][0-9]{1,14}$/  (1-15 hane)
 * Kaynak: supabase/auth internal/api/phone.go
 */

export const DEFAULT_COUNTRY_CODE = '90';
export const E164_MAX_LENGTH = 15;

/**
 * Sik kullanilan ulke kodlari. `nationalLength` varsa tam o kadar hane beklenir.
 * Parse sirasi: uzun kod once (1 vs 1242 gibi catismalar icin).
 */
export const COUNTRY_DIAL_OPTIONS = [
  { code: '90', iso: 'TR', label: 'Türkiye', nationalLength: 10 },
  { code: '49', iso: 'DE', label: 'Almanya', nationalLength: null },
  { code: '43', iso: 'AT', label: 'Avusturya', nationalLength: null },
  { code: '41', iso: 'CH', label: 'İsviçre', nationalLength: null },
  { code: '31', iso: 'NL', label: 'Hollanda', nationalLength: null },
  { code: '32', iso: 'BE', label: 'Belçika', nationalLength: null },
  { code: '33', iso: 'FR', label: 'Fransa', nationalLength: null },
  { code: '39', iso: 'IT', label: 'İtalya', nationalLength: null },
  { code: '34', iso: 'ES', label: 'İspanya', nationalLength: null },
  { code: '44', iso: 'GB', label: 'Birleşik Krallık', nationalLength: null },
  { code: '1', iso: 'US', label: 'ABD / Kanada', nationalLength: 10 },
  { code: '7', iso: 'RU', label: 'Rusya / Kazakistan', nationalLength: null },
  { code: '971', iso: 'AE', label: 'BAE', nationalLength: 9 },
  { code: '966', iso: 'SA', label: 'Suudi Arabistan', nationalLength: 9 },
  { code: '994', iso: 'AZ', label: 'Azerbaycan', nationalLength: 9 },
  { code: '995', iso: 'GE', label: 'Gürcistan', nationalLength: 9 },
  { code: '98', iso: 'IR', label: 'İran', nationalLength: 10 },
  { code: '964', iso: 'IQ', label: 'Irak', nationalLength: 10 },
  { code: '961', iso: 'LB', label: 'Lübnan', nationalLength: 8 },
  { code: '962', iso: 'JO', label: 'Ürdün', nationalLength: 9 },
  { code: '20', iso: 'EG', label: 'Mısır', nationalLength: 10 },
  { code: '212', iso: 'MA', label: 'Fas', nationalLength: 9 },
  { code: '216', iso: 'TN', label: 'Tunus', nationalLength: 8 },
  { code: '355', iso: 'AL', label: 'Arnavutluk', nationalLength: 9 },
  { code: '359', iso: 'BG', label: 'Bulgaristan', nationalLength: 9 },
  { code: '30', iso: 'GR', label: 'Yunanistan', nationalLength: 10 },
  { code: '40', iso: 'RO', label: 'Romanya', nationalLength: 9 },
  { code: '380', iso: 'UA', label: 'Ukrayna', nationalLength: 9 },
  { code: '48', iso: 'PL', label: 'Polonya', nationalLength: 9 },
  { code: '36', iso: 'HU', label: 'Macaristan', nationalLength: 9 },
  { code: '420', iso: 'CZ', label: 'Çekya', nationalLength: 9 },
  { code: '46', iso: 'SE', label: 'İsveç', nationalLength: null },
  { code: '47', iso: 'NO', label: 'Norveç', nationalLength: 8 },
  { code: '45', iso: 'DK', label: 'Danimarka', nationalLength: 8 },
  { code: '358', iso: 'FI', label: 'Finlandiya', nationalLength: null },
  { code: '81', iso: 'JP', label: 'Japonya', nationalLength: null },
  { code: '82', iso: 'KR', label: 'Güney Kore', nationalLength: null },
  { code: '86', iso: 'CN', label: 'Çin', nationalLength: 11 },
  { code: '91', iso: 'IN', label: 'Hindistan', nationalLength: 10 },
  { code: '61', iso: 'AU', label: 'Avustralya', nationalLength: 9 },
  { code: '55', iso: 'BR', label: 'Brezilya', nationalLength: 11 },
];

const DIAL_BY_CODE = new Map(COUNTRY_DIAL_OPTIONS.map((item) => [item.code, item]));

const DIAL_CODES_LONGEST_FIRST = [...COUNTRY_DIAL_OPTIONS]
  .map((item) => item.code)
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

export function digitsOnly(value = '') {
  return String(value || '').replace(/\D/g, '');
}

export function getCountryOption(code = DEFAULT_COUNTRY_CODE) {
  const normalized = digitsOnly(code) || DEFAULT_COUNTRY_CODE;
  const found = DIAL_BY_CODE.get(normalized);
  if (found) return found;

  return {
    code: normalized,
    iso: 'XX',
    label: `Diğer (+${normalized})`,
    nationalLength: null,
  };
}

/** Ulusal kisim icin max hane: E.164 toplam 15 - ulke kodu */
export function maxNationalLength(countryCode = DEFAULT_COUNTRY_CODE) {
  const code = digitsOnly(countryCode) || DEFAULT_COUNTRY_CODE;
  const option = getCountryOption(code);
  const hardMax = Math.max(4, E164_MAX_LENGTH - code.length);

  if (option?.nationalLength) {
    return Math.min(option.nationalLength, hardMax);
  }

  return hardMax;
}

export function sanitizeCountryCodeInput(raw = '') {
  let digits = digitsOnly(raw).replace(/^0+/, '');
  if (!digits) return DEFAULT_COUNTRY_CODE;
  // Ulke kodu pratikte 1-3 hane (nadiren 4)
  return digits.slice(0, 4);
}

export function sanitizeNationalInput(raw = '', countryCode = DEFAULT_COUNTRY_CODE) {
  let digits = digitsOnly(raw);
  const code = digitsOnly(countryCode) || DEFAULT_COUNTRY_CODE;

  // Yerel yazim: basindaki 0'i at (05... / 0...)
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  // Ulke kodunu ulusal alana yapistirdiysa kirp
  if (code && digits.startsWith(code) && digits.length > maxNationalLength(code)) {
    digits = digits.slice(code.length);
  }

  return digits.slice(0, maxNationalLength(code));
}

/** TR gorunumu: 5XX XXX XX XX — diger ulkelerde 3'lu gruplar */
export function formatNationalDisplay(nationalDigits = '', countryCode = DEFAULT_COUNTRY_CODE) {
  const code = digitsOnly(countryCode) || DEFAULT_COUNTRY_CODE;
  const d = digitsOnly(nationalDigits).slice(0, maxNationalLength(code));

  if (code === '90') {
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 3));
    if (d.length > 3) parts.push(d.slice(3, 6));
    if (d.length > 6) parts.push(d.slice(6, 8));
    if (d.length > 8) parts.push(d.slice(8, 10));
    return parts.join(' ');
  }

  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function toSupabasePhone(countryCode = DEFAULT_COUNTRY_CODE, nationalDigits = '') {
  const code = digitsOnly(countryCode);
  const national = sanitizeNationalInput(nationalDigits, code);
  if (!national) return '';

  const combined = `${code}${national}`;
  return combined.slice(0, E164_MAX_LENGTH);
}

export function isValidSupabasePhone(value = '') {
  if (!value) return true;
  return /^[1-9][0-9]{1,14}$/.test(value);
}

/**
 * Kayitli E.164'ten { countryCode, national } ayiklar.
 * Bilinen kod listesinden en uzun eslesmeyi kullanir.
 */
export function splitSupabasePhone(value = '') {
  let digits = digitsOnly(value);
  if (!digits) {
    return { countryCode: DEFAULT_COUNTRY_CODE, national: '' };
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Tek basina ulusal TR (10 hane veya 0+10)
  if (digits.length === 11 && digits.startsWith('0')) {
    return { countryCode: DEFAULT_COUNTRY_CODE, national: digits.slice(1) };
  }
  if (digits.length === 10 && /^[2-5]/.test(digits)) {
    return { countryCode: DEFAULT_COUNTRY_CODE, national: digits };
  }

  for (const code of DIAL_CODES_LONGEST_FIRST) {
    if (digits.startsWith(code) && digits.length > code.length) {
      return {
        countryCode: code,
        national: digits.slice(code.length, code.length + maxNationalLength(code)),
      };
    }
  }

  // Liste disi: ilk 1-3 haneyi kod kabul et
  const fallbackCode = digits.slice(0, Math.min(3, Math.max(1, digits.length - 4)));
  return {
    countryCode: fallbackCode || DEFAULT_COUNTRY_CODE,
    national: digits.slice(fallbackCode.length),
  };
}

export function isValidNationalNumber(nationalDigits = '', countryCode = DEFAULT_COUNTRY_CODE) {
  const code = digitsOnly(countryCode) || DEFAULT_COUNTRY_CODE;
  const national = sanitizeNationalInput(nationalDigits, code);
  if (!national) return true;

  const option = getCountryOption(code);
  const expected = option?.nationalLength;
  const maxLen = maxNationalLength(code);

  if (national.length > maxLen) return false;

  // TR: sabit kural
  if (code === '90') {
    return /^[2-5]\d{9}$/.test(national);
  }

  if (expected) {
    return national.length === expected;
  }

  // Esnek ulkeler: en az 6, en fazla maxLen; toplam E.164 gecerli olsun
  if (national.length < 6) return false;
  return isValidSupabasePhone(`${code}${national}`);
}

export function countrySelectLabel(option) {
  return `${option.iso} +${option.code} · ${option.label}`;
}
