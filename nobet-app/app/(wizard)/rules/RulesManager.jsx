'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HARD_RULE_KEYS, HARD_RULE_LABELS } from '@/lib/db/rules';
import { toggleRule } from './actions';
import './rules.css';

export default function RulesManager({ schoolName, initialActiveKeys }) {
  const supabase = createClient();
  const router = useRouter();

  const [activeKeys, setActiveKeys] = useState(new Set(initialActiveKeys));
  const [savingKey, setSavingKey] = useState(null);
  const [toast, setToast] = useState({ msg: '', isErr: false, visible: false });

  function showToast(msg, isErr = false) {
    setToast({ msg, isErr, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleToggle(ruleKey, checked) {
    setSavingKey(ruleKey);
    const result = await toggleRule(ruleKey, checked);
    setSavingKey(null);
    if (result.error) { showToast(result.error, true); return; }

    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(ruleKey); else next.delete(ruleKey);
      return next;
    });
    showToast(checked ? 'Kural açıldı' : 'Kural kapatıldı');
  }

  return (
    <div className="rules-root">
      <header>
        <h1>⚖️ Kural Ayarları</h1>
        <div className="school-name">{schoolName}</div>
        <button className="rules-btn" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={handleLogout}>
          Çıkış Yap
        </button>
      </header>

      <div className="rules-info-box">
        💡 Aşağıdaki kurallar, program otomatik oluşturulurken (Program Oluştur) her atamada kontrol
        edilir. Bir kuralı kapatırsan, o kural artık kimseyi elemez — dikkatli kullan.
      </div>

      <div className="rules-card">
        <h3>Hard Rule'lar (kesin kurallar)</h3>
        <div className="rules-list">
          {HARD_RULE_KEYS.map((key) => (
            <label key={key} className="rules-item">
              <input
                type="checkbox"
                checked={activeKeys.has(key)}
                disabled={savingKey === key}
                onChange={(e) => handleToggle(key, e.target.checked)}
              />
              <div>
                <div className="rules-item-key">{key}</div>
                <div className="rules-item-desc">{HARD_RULE_LABELS[key]}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div id="rules-toast" className={toast.visible ? 'show' : ''} style={{ background: toast.isErr ? 'var(--danger)' : 'var(--success)', color: toast.isErr ? '#fff' : '#0f2e1a' }}>
        {toast.msg}
      </div>
    </div>
  );
}
