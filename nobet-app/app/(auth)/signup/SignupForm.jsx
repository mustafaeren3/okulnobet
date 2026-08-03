'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { startSignup, resendSignupCode, verifySignupCode, searchSchoolsAction } from './actions';
import { MEB_PROVINCES, getDistrictsForProvince } from '@/lib/data/mebProvinceDistricts';
import SchoolSearchField from './SchoolSearchField';

// Kayıt formunun/akışının TEK kaynağı — /signup sayfası VE SignupModal
// (bkz. app/components/SignupModal.jsx) bunu paylaşır. LoginForm/LoginModal
// ile aynı desen: başlık/alt metin/footer linki gibi sarmalayıcıya özgü
// düzen dışarıda kalır, form alanları + iki fazlı (form → kod) mantık
// burada tek yerde yaşar — kod tekrarı olmasın diye.
//
// Başlık (h1#signup-form-title) BİLEREK burada, sarmalayıcıda değil —
// Login'den farklı olarak Signup'ın başlığı `phase`'e göre değişiyor
// (faz bu bileşenin kendi state'i), bu yüzden LoginForm/LoginModal'daki
// "başlık sarmalayıcıda" ayrımı burada zorlama olurdu. Modal, bu id'yi
// aria-labelledby için kullanıyor; sayfada aria-labelledby hiç
// kullanılmadığı için id'nin orada durması zararsız.
export default function SignupForm() {
  // phase 'form': bilgiler toplanır. phase 'code': e-postaya giden 6
  // haneli kod girilir, doğrulanınca okul oluşturulur.
  const [phase, setPhase] = useState('form');
  const [fields, setFields] = useState({ fullName: '', email: '', password: '' });
  const [selectedSchool, setSelectedSchool] = useState(null);
  // Arama listesinde okulunu bulamayan kullanıcılar için tek geri düşüş —
  // il/ilçe burada BİLEREK serbest metin değil, MEB'in kendi il/ilçe
  // listesinden seçiliyor (schoolSearch.js'in aynı temiz veri kaynağı),
  // aksi halde tam da düzelttiğimiz duplicate/yazım sorununu manuel
  // girişten geri açmış oluruz.
  const [manualMode, setManualMode] = useState(false);
  const [manualIl, setManualIl] = useState('');
  const [manualIlce, setManualIlce] = useState('');
  const [manualOkulAdi, setManualOkulAdi] = useState('');
  const manualDistricts = useMemo(() => getDistrictsForProvince(manualIl), [manualIl]);

  // KVKK: Kullanım Koşulları/Gizlilik onayı ZORUNLU, pazarlama izni
  // İSTEĞE BAĞLI (varsayılan boş) — bkz. 0045_signup_consent.sql.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // SchoolSearchField'a stabil bir referans geçiyoruz (useCallback) —
  // aksi halde her render'da yeni bir fonksiyon, arama kutusunun kendi
  // memoizasyonunu (ResultRow) boşa çıkarırdı.
  const runSearch = useCallback((q) => searchSchoolsAction(q), []);

  function updateField(name, value) {
    setFields((f) => ({ ...f, [name]: value }));
  }

  function handleManualEntry() {
    setManualMode(true);
    setSelectedSchool(null);
  }

  const okulAdiFinal = manualMode ? manualOkulAdi.trim() : selectedSchool?.name || '';
  const il = manualMode ? manualIl : selectedSchool?.province || '';
  const ilce = manualMode ? manualIlce : selectedSchool?.district || '';

  async function handleStartSignup(e) {
    e.preventDefault();
    setError('');
    if (!okulAdiFinal || !il || !ilce) { setError('Okulunu seç veya elle gir.'); return; }
    if (!termsAccepted) { setError("Devam etmek için Kullanım Koşulları ve Gizlilik Politikası onayı gerekli."); return; }
    setBusy(true);
    const res = await startSignup({
      fullName: fields.fullName.trim(),
      email: fields.email,
      password: fields.password,
      okulAdi: okulAdiFinal,
      il,
      ilce,
      termsAccepted,
    });
    setBusy(false);
    if (res?.error) { setError(res.error); return; }
    // OTP doğrulanmadan hesap/okul tamamlanmıyor — startSignup() artık HİÇBİR
    // durumda doğrudan dashboard'a yönlendirmiyor, her zaman kod adımına geçilir.
    setPhase('code');
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await verifySignupCode({
      email: fields.email,
      code,
      okulAdi: okulAdiFinal,
      il,
      ilce,
      marketingConsent,
    });
    setBusy(false);
    if (res?.error) setError(res.error);
    // Başarılıysa action içinde redirect('/dashboard') tetiklenir.
  }

  async function handleResend() {
    setResendMsg('');
    const res = await resendSignupCode(fields.email);
    setResendMsg(res?.error ? res.error : 'Kod tekrar gönderildi.');
  }

  return (
    <>
      <h1 id="signup-form-title">{phase === 'form' ? 'Okulunu Kaydet' : 'E-postanı Onayla'}</h1>

      {phase === 'form' && (
        <form onSubmit={handleStartSignup} style={{ marginTop: 20 }}>
          <div className="auth-field">
            <label>Ad Soyad</label>
            <input value={fields.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Ayşe Yılmaz" required />
          </div>

          {!manualMode ? (
            <SchoolSearchField searchAction={runSearch} onSelect={setSelectedSchool} onManualEntry={handleManualEntry} />
          ) : (
            <>
              <div className="auth-field">
                <label>Okul Adı</label>
                <input value={manualOkulAdi} onChange={(e) => setManualOkulAdi(e.target.value)} placeholder="Okul adını yazın" required />
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label>İl</label>
                  <select value={manualIl} onChange={(e) => { setManualIl(e.target.value); setManualIlce(''); }} required>
                    <option value="" disabled>Seçiniz</option>
                    {MEB_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="auth-field">
                  <label>İlçe</label>
                  <select value={manualIlce} onChange={(e) => setManualIlce(e.target.value)} required disabled={!manualIl}>
                    <option value="" disabled>{manualIl ? 'Seçiniz' : 'Önce il seçin'}</option>
                    {manualDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="auth-subtitle"
                style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginBottom: 14 }}
                onClick={() => { setManualMode(false); setManualOkulAdi(''); setManualIl(''); setManualIlce(''); }}
              >
                Aramaya geri dön
              </button>
            </>
          )}

          <div className="auth-field">
            <label>E-posta</label>
            <input value={fields.email} onChange={(e) => updateField('email', e.target.value)} type="email" placeholder="ornek@okul.com" required />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Şifre</label>
            <div className="auth-password-wrap">
              <input
                id="signup-password"
                value={fields.password}
                onChange={(e) => updateField('password', e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-consent">
            <label className="auth-consent-row">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
              />
              <span>
                <Link href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer">Kullanım Koşulları&apos;nı</Link>
                {' '}ve{' '}
                <Link href="/gizlilik" target="_blank" rel="noopener noreferrer">Gizlilik Politikası&apos;nı</Link>
                {' '}okudum, kabul ediyorum.
              </span>
            </label>

            <label className="auth-consent-row">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
              />
              <span>
                OkulNöbet&apos;in yeni özellikleri, ürün güncellemeleri, eğitim içerikleri ve kampanyaları hakkında
                e-posta almayı kabul ediyorum.
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Gönderiliyor...' : 'Kaydol'}
          </button>
        </form>
      )}

      {phase === 'code' && (
        <form onSubmit={handleVerify} style={{ marginTop: 20 }}>
          <div className="auth-info">
            <strong>{fields.email}</strong> adresine 6 haneli bir onay kodu gönderdik. Kodu aşağıya gir.
          </div>
          <div className="auth-field">
            <label>Onay Kodu</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              required
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Doğrulanıyor...' : 'Onayla ve Devam Et'}
          </button>
          <button type="button" onClick={handleResend} className="btn btn-outline" style={{ width: '100%', marginTop: 10 }}>
            Kodu Tekrar Gönder
          </button>
          {resendMsg && <div className="auth-subtitle" style={{ marginTop: 10, marginBottom: 0 }}>{resendMsg}</div>}
        </form>
      )}

      {error && <div className="auth-error">{error}</div>}
    </>
  );
}
