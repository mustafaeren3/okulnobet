import { describe, it, expect } from 'vitest';
import { sanitizeDbErrorMessage } from '@/lib/errors';

describe('sanitizeDbErrorMessage', () => {
  it('kendi Türkçe raise exception mesajlarımızı aynen geçirir (geçer)', () => {
    expect(sanitizeDbErrorMessage('Okul bulunamadı.')).toBe('Okul bulunamadı.');
    expect(sanitizeDbErrorMessage('İşlem nedeni zorunlu.')).toBe('İşlem nedeni zorunlu.');
    expect(sanitizeDbErrorMessage('Yetkiniz yok.')).toBe('Yetkiniz yok.');
  });

  it('şema bilgisi sızdıran ham Postgres/PostgREST hatalarını generic mesajla değiştirir (eler)', () => {
    const leaky = [
      'Could not find the table \'public.enterprise_leads\' in the schema cache',
      'duplicate key value violates unique constraint "subscriptions_school_id_key"',
      'relation "public.foo" does not exist',
      'column "bar" does not exist',
      'permission denied for table schools',
      'syntax error at or near "SELECT"',
    ];
    for (const msg of leaky) {
      expect(sanitizeDbErrorMessage(msg)).toBe('Bir şeyler ters gitti, tekrar dene. Sorun devam ederse destek ile iletişime geç.');
    }
  });

  it('boş/tanımsız girdi için de güvenli şekilde çalışır (sınır durumu, eler)', () => {
    expect(() => sanitizeDbErrorMessage(undefined)).not.toThrow();
    expect(sanitizeDbErrorMessage(undefined)).toBe('');
  });
});
