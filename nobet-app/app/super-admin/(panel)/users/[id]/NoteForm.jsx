'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { submitSchoolNote } from '../../../actions/schools';

export default function NoteForm({ schoolId }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setError('');
    const res = await submitSchoolNote(schoolId, note.trim());
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setNote('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not ekle..." disabled={busy} />
      <Button type="submit" disabled={busy || !note.trim()}>Ekle</Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
