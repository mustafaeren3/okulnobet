import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin, getSchoolDetail, getPlatformAuditLogs } from '@/lib/db/platformAdmin';
import SchoolDetailClient from './SchoolDetailClient';

export default async function SchoolDetailPage({ params }) {
  const supabase = createClient();
  await requirePlatformAdmin(supabase);

  const detail = await getSchoolDetail(supabase, params.id);
  if (!detail) notFound();

  const auditLogs = await getPlatformAuditLogs(supabase, { schoolId: params.id, limit: 50 });

  return <SchoolDetailClient schoolId={params.id} detail={detail} initialAuditLogs={auditLogs} />;
}
