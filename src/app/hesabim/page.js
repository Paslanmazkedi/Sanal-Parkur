'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase';
import {
  COUNTRY_DIAL_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  countrySelectLabel,
  formatNationalDisplay,
  getCountryOption,
  isValidNationalNumber,
  isValidSupabasePhone,
  maxNationalLength,
  sanitizeNationalInput,
  splitSupabasePhone,
  toSupabasePhone,
} from '@/lib/phone';
import PageHeader from '@/components/PageHeader';

const TABS = [
  { id: 'profile', label: 'Profil' },
  { id: 'password', label: 'Şifre' },
];

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {children}
      {hint ? <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p> : null}
    </label>
  );
}

function ReadRow({ label, value, empty = 'Belirtilmedi' }) {
  return (
    <div className="border-b border-slate-800/80 py-3 last:border-b-0 lg:grid lg:grid-cols-[10rem_1fr] lg:items-center lg:gap-4 lg:py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm text-slate-100 lg:mt-0">{value || empty}</p>
    </div>
  );
}

function inputClassName() {
  return 'mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400';
}

function Message({ tone = 'error', children }) {
  const styles =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : 'border-red-500/30 bg-red-500/10 text-red-200';

  return <div className={`rounded-md border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function resolveDisplayName(user, profile) {
  return (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    ''
  );
}

function resolvePhone(user, profile) {
  return profile?.phone || user?.user_metadata?.phone || user?.phone || '';
}

async function syncPublicProfile({ userId, fullName, phone }) {
  const payload = {
    id: userId,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  };

  const withPhone = { ...payload, phone };

  const first = await supabase.schema('public').from('profiles').upsert(withPhone, { onConflict: 'id' });
  if (!first.error) return { ok: true };

  const second = await supabase.schema('public').from('profiles').upsert(payload, { onConflict: 'id' });
  if (!second.error) return { ok: true, warning: first.error.message };

  return { ok: false, error: second.error.message };
}

const SORTED_COUNTRY_OPTIONS = [...COUNTRY_DIAL_OPTIONS].sort((a, b) => {
  if (a.code === DEFAULT_COUNTRY_CODE) return -1;
  if (b.code === DEFAULT_COUNTRY_CODE) return 1;
  return a.label.localeCompare(b.label, 'tr');
});

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState('profile');
  const [editingProfile, setEditingProfile] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNational, setPhoneNational] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState({
    displayName: '',
    countryCode: DEFAULT_COUNTRY_CODE,
    phoneNational: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const countryOption = useMemo(() => getCountryOption(countryCode), [countryCode]);
  const countryOptions = useMemo(() => {
    if (SORTED_COUNTRY_OPTIONS.some((item) => item.code === countryCode)) {
      return SORTED_COUNTRY_OPTIONS;
    }

    return [
      {
        code: countryCode,
        iso: 'XX',
        label: `Diğer (+${countryCode})`,
        nationalLength: null,
      },
      ...SORTED_COUNTRY_OPTIONS,
    ];
  }, [countryCode]);

  const phoneDisplay = formatNationalDisplay(phoneNational, countryCode);
  const phoneE164 = toSupabasePhone(countryCode, phoneNational);
  const nationalMax = maxNationalLength(countryCode);
  const nationalPlaceholder =
    countryCode === '90' ? '5XX XXX XX XX' : 'X'.repeat(Math.min(nationalMax, 10));

  const savedPhoneDisplay = savedSnapshot.phoneNational
    ? `+${savedSnapshot.countryCode} ${formatNationalDisplay(savedSnapshot.phoneNational, savedSnapshot.countryCode)}`
    : '';

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoadingProfile(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (authError || !authData?.user) {
        setLoadingProfile(false);
        setProfileError(authError?.message || 'Oturum bulunamadı.');
        return;
      }

      const user = authData.user;
      setEmail(user.email || '');

      const { data: profile } = await supabase
        .schema('public')
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      const nextName = resolveDisplayName(user, profile);
      const split = splitSupabasePhone(resolvePhone(user, profile));
      const nextCountry = split.countryCode || DEFAULT_COUNTRY_CODE;
      const nextNational = split.national || '';

      setDisplayName(nextName);
      setCountryCode(nextCountry);
      setPhoneNational(nextNational);
      setSavedSnapshot({
        displayName: nextName,
        countryCode: nextCountry,
        phoneNational: nextNational,
      });
      setLoadingProfile(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordMessage('');
  };

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setEditingProfile(false);
    setDisplayName(savedSnapshot.displayName);
    setCountryCode(savedSnapshot.countryCode);
    setPhoneNational(savedSnapshot.phoneNational);
    setProfileError('');
    setProfileMessage('');
    resetPasswordFields();
  };

  const startProfileEdit = () => {
    setProfileError('');
    setProfileMessage('');
    setEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setDisplayName(savedSnapshot.displayName);
    setCountryCode(savedSnapshot.countryCode);
    setPhoneNational(savedSnapshot.phoneNational);
    setProfileError('');
    setProfileMessage('');
    setEditingProfile(false);
  };

  const handleCountryChange = (event) => {
    const nextCode = event.target.value;
    setCountryCode(nextCode);
    setPhoneNational((current) => sanitizeNationalInput(current, nextCode));
  };

  const handlePhoneChange = (event) => {
    setPhoneNational(sanitizeNationalInput(event.target.value, countryCode));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileSaving(true);

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setProfileSaving(false);
      setProfileError('Görünen ad boş olamaz.');
      return;
    }

    if (phoneNational && !isValidNationalNumber(phoneNational, countryCode)) {
      const expected = countryOption?.nationalLength;
      setProfileSaving(false);
      setProfileError(
        expected
          ? `Telefon ${expected} haneli olmalı (+${countryCode}).`
          : `Telefon numarası +${countryCode} için geçersiz veya eksik.`,
      );
      return;
    }

    if (!isValidSupabasePhone(phoneE164)) {
      setProfileSaving(false);
      setProfileError('Telefon formatı geçersiz.');
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setProfileSaving(false);
      setProfileError(userError?.message || 'Oturum bulunamadı.');
      return;
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        display_name: trimmedName,
        phone: phoneE164 || null,
      },
    });

    if (authUpdateError) {
      setProfileSaving(false);
      setProfileError(authUpdateError.message);
      return;
    }

    await syncPublicProfile({
      userId: user.id,
      fullName: trimmedName,
      phone: phoneE164 || null,
    });

    setSavedSnapshot({
      displayName: trimmedName,
      countryCode,
      phoneNational,
    });
    setDisplayName(trimmedName);
    setProfileSaving(false);
    setEditingProfile(false);
    setProfileMessage('Profil bilgileriniz kaydedildi.');
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setPasswordSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setPasswordSaving(false);
      setPasswordError(userError?.message || 'Oturum bulunamadı.');
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setPasswordSaving(false);
      setPasswordError('Mevcut şifre hatalı.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordSaving(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    resetPasswordFields();
    setPasswordMessage('Şifreniz güncellendi.');
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-5 pb-8 lg:max-w-5xl lg:space-y-6">
      <PageHeader
        title="Hesabım"
        titleClassName="text-emerald-100"
        description="Kullanıcı Bilgileri"
        actions={
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            title="Çıkış yap"
            aria-label={logoutLoading ? 'Çıkış yapılıyor' : 'Çıkış yap'}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-950/20 px-2.5 text-[11px] font-semibold text-rose-200 transition hover:border-rose-400/45 hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-60 lg:h-9 lg:px-3 lg:text-xs"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1" />
              <path d="M15 12H4" />
              <path d="M7 9l-3 3 3 3" />
            </svg>
            {logoutLoading ? '...' : (
              <>
                <span className="lg:hidden">Çıkış</span>
                <span className="hidden lg:inline">Çıkış yap</span>
              </>
            )}
          </button>
        }
      />

      <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Mobil / tablet: yatay sekmeler */}
        <div
          role="tablist"
          aria-label="Hesap sekmeleri"
          className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/60 p-1 lg:hidden"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(item.id)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* PC: dikey yan menü */}
        <aside className="hidden lg:block">
          <nav
            role="tablist"
            aria-label="Hesap menüsü"
            className="sticky top-24 space-y-1 rounded-xl border border-slate-800 bg-slate-900/50 p-2"
          >
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="mt-5 min-w-0 lg:mt-0">
          {tab === 'profile' ? (
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 lg:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white lg:text-base">Profil bilgileri</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {editingProfile ? 'Değişiklikleri kaydedin veya iptal edin.' : 'Bilgilerinizi görüntüleyin.'}
                  </p>
                </div>
                {!editingProfile && !loadingProfile ? (
                  <button
                    type="button"
                    onClick={startProfileEdit}
                    className="shrink-0 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-200"
                  >
                    Düzenle
                  </button>
                ) : null}
              </div>

              {profileMessage && !editingProfile ? (
                <div className="mt-4">
                  <Message tone="success">{profileMessage}</Message>
                </div>
              ) : null}

              {loadingProfile ? (
                <p className="mt-5 text-sm text-slate-500">Yükleniyor...</p>
              ) : editingProfile ? (
                <form onSubmit={handleProfileSave} className="mt-5 space-y-4 lg:max-w-xl">
                  <Field label="Email" hint="Email bu ekrandan değiştirilemez.">
                    <input className={inputClassName()} type="email" value={email} disabled readOnly />
                  </Field>

                  <Field label="Görünen ad">
                    <input
                      className={inputClassName()}
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      disabled={profileSaving}
                      placeholder="Örn. Ahmet Yılmaz"
                      required
                    />
                  </Field>

                  <div className="block">
                    <span className="text-sm font-semibold text-slate-300">Telefon</span>
                    <div className="mt-2 grid grid-cols-[minmax(9rem,10.5rem)_1fr] gap-2">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
                          +
                        </span>
                        <select
                          className="w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-3 pl-7 pr-8 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                          value={countryCode}
                          onChange={handleCountryChange}
                          disabled={profileSaving}
                          aria-label="Ülke kodu"
                        >
                          {countryOptions.map((option) => (
                            <option key={`${option.iso}-${option.code}`} value={option.code}>
                              {countrySelectLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phoneDisplay}
                        onChange={handlePhoneChange}
                        disabled={profileSaving}
                        placeholder={nationalPlaceholder}
                        maxLength={nationalMax + 4}
                        aria-label="Ulusal telefon numarası"
                      />
                    </div>
                  </div>

                  {profileError ? <Message>{profileError}</Message> : null}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelProfileEdit}
                      disabled={profileSaving}
                      className="rounded-md border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-60"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="rounded-md bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {profileSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2 lg:mt-4 lg:rounded-lg lg:border lg:border-slate-800/80 lg:bg-slate-950/40 lg:px-5 lg:py-1">
                  <ReadRow label="Email" value={email} />
                  <ReadRow label="Görünen ad" value={savedSnapshot.displayName} />
                  <ReadRow label="Telefon" value={savedPhoneDisplay} />
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 lg:p-7">
              <div>
                <h2 className="text-sm font-semibold text-white lg:text-base">Şifre güncelle</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Mevcut şifrenizi doğrulayıp yenisini belirleyin.
                </p>
              </div>

              {passwordMessage ? (
                <div className="mt-4">
                  <Message tone="success">{passwordMessage}</Message>
                </div>
              ) : null}

              <form onSubmit={handlePasswordSave} className="mt-5 space-y-4 lg:max-w-md">
                <Field label="Mevcut şifre">
                  <input
                    className={inputClassName()}
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={passwordSaving}
                    autoComplete="current-password"
                    required
                  />
                </Field>

                <Field label="Yeni şifre">
                  <input
                    className={inputClassName()}
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={passwordSaving}
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </Field>

                <Field label="Yeni şifre (tekrar)">
                  <input
                    className={inputClassName()}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={passwordSaving}
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </Field>

                {passwordError ? <Message>{passwordError}</Message> : null}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full rounded-md bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {passwordSaving ? 'Güncelleniyor...' : 'Şifreyi kaydet'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
