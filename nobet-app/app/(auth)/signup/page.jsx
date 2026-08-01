'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { startSignup, resendSignupCode, verifySignupCode, fetchSchoolsForDistrict } from './actions';
import { MEB_PROVINCES, getDistrictsForProvince } from '@/lib/data/mebProvinceDistricts';
import { SCHOOL_TYPE_LABELS } from '@/lib/data/schoolTypes';
import Logo from '../../components/Logo';
import '../auth.css';

const OKUL_DIGER_VALUE = '__DIGER__';
const OKUL_OZEL_VALUE = '__OZEL__';

export default function SignupPage() {
  // phase 'form': bilgiler toplanır. phase 'code': e-postaya giden 6
  // haneli kod girilir, doğrulanınca okul oluşturulur.
  const [phase, setPhase] = useState('form');
  const [fields, setFields] = useState({ fullName: '', il: '', ilce: '', okulSecim: '', okulAdiManual: '', schoolType: '', email: '', password: '' });
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const districts = useMemo(() => getDistrictsForProvince(fields.il), [fields.il]);

  useEffect(() => {
    if (!fields.il || !fields.ilce) { setSchoolOptions([]); return; }
    let cancelled = false;
    setSchoolsLoading(true);
    fetchSchoolsForDistrict(fields.il, fields.ilce).then((list) => {
      if (!cancelled) { setSchoolOptions(list); setSchoolsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fields.il, fields.ilce]);

  function updateField(name, value) {
    setFields((f) => ({ ...f, [name]: value }));
  }

  function handleProvinceChange(value) {
    // İl değişince eski ilçe/okul artık geçersiz olabilir — sıfırlanır.
    setFields((f) => ({ ...f, il: value, ilce: '', okulSecim: '', okulAdiManual: '' }));
  }

  function handleDistrictChange(value) {
    setFields((f) => ({ ...f, ilce: value, okulSecim: '', okulAdiManual: '' }));
  }

  const isManualEntry = fields.okulSecim === OKUL_DIGER_VALUE || fields.okulSecim === OKUL_OZEL_VALUE;
  const okulAdiFinal = isManualEntry ? fields.okulAdiManual.trim() : fields.okulSecim;

  async function handleStartSignup(e) {
    e.preventDefault();
    setError('');
    if (!okulAdiFinal) { setError('Okul adını seçin veya yazın.'); return; }
    if (!fields.schoolType) { setError('Okul türünü seçin.'); return; }
    setBusy(true);
    const res = await startSignup({
      fullName: fields.fullName.trim(),
      email: fields.email,
      password: fields.password,
      okulAdi: okulAdiFinal,
      il: fields.il,
      ilce: fields.ilce,
      schoolType: fields.schoolType,
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
      il: fields.il,
      ilce: fields.ilce,
      schoolType: fields.schoolType,
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
    <div className="auth-root">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <Link href="/" className="auth-logo">
          <Logo size={34} />
          <span>OkulNöbet</span>
        </Link>
        <div className="auth-subtitle">Okulunu ücretsiz kaydet, hemen programını oluştur</div>
        <h1>{phase === 'form' ? 'Okulunu Kaydet' : 'E-postanı Onayla'}</h1>

        {phase === 'form' && (
          <form onSubmit={handleStartSignup} style={{ marginTop: 20 }}>
            <div className="auth-field">
              <label>Ad Soyad</label>
              <input value={fields.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Ayşe Yılmaz" required />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>İl</label>
                <select value={fields.il} onChange={(e) => handleProvinceChange(e.target.value)} required>
                  <option value="" disabled>Seçiniz</option>
                  {MEB_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label>İlçe</label>
                <select value={fields.ilce} onChange={(e) => handleDistrictChange(e.target.value)} required disabled={!fields.il}>
                  <option value="" disabled>{fields.il ? 'Seçiniz' : 'Önce il seçin'}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label>Okul Adı</label>
              <select
                value={fields.okulSecim}
                onChange={(e) => updateField('okulSecim', e.target.value)}
                required
                disabled={!fields.ilce || schoolsLoading}
              >
                <option value="" disabled>
                  {!fields.ilce ? 'Önce il ve ilçe seçin' : schoolsLoading ? 'Okullar yükleniyor...' : 'Seçiniz'}
                </option>
                {schoolOptions.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.typeLabel})</option>
                ))}
                {fields.ilce && !schoolsLoading && (
                  <>
                    <option value={OKUL_OZEL_VALUE}>(Özel Okul) — listede yok, kendim yazacağım</option>
                    <option value={OKUL_DIGER_VALUE}>Diğer — okulumu listede bulamadım</option>
                  </>
                )}
              </select>
            </div>

            {isManualEntry && (
              <div className="auth-field">
                <label>{fields.okulSecim === OKUL_OZEL_VALUE ? 'Özel Okulunuzun Adı' : 'Okulunuzun Adı'}</label>
                <input
                  value={fields.okulAdiManual}
                  onChange={(e) => updateField('okulAdiManual', e.target.value)}
                  placeholder="Okul adını yazın"
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label>Okul Türü</label>
              <select value={fields.schoolType} onChange={(e) => updateField('schoolType', e.target.value)} required>
                <option value="" disabled>Seçiniz</option>
                {Object.entries(SCHOOL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

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

        <div className="auth-footer-link">
          Zaten hesabın var mı? <Link href="/login">Giriş yap</Link>
        </div>
      </div>
    </div>
  );
}
