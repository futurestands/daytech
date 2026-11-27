import { assertRetentionTarget, runRetentionDryRun, type RetentionPolicy } from '../server/lib/retentionDryRun';

const [projectId = '', databaseId = '', host = '', ...intervals] = process.argv.slice(2);
assertRetentionTarget(projectId, databaseId, host);
if (intervals.length !== 4) throw new Error('Supply lead days, partner days, quota grace hours and audit days.');
const [leadDays, partnerDays, quotaGraceHours, auditDays] = intervals.map(Number);
const policy: RetentionPolicy = { leadDays, partnerDays, quotaGraceHours, auditDays };
const root = `http://${host}/v1/projects/${projectId}/databases/${databaseId}/documents`;
const report = await runRetentionDryRun({
  projectId, databaseId, host, now: Date.now(), policy,
  async readPage(collection, cursor) {
    const params = new URLSearchParams({ pageSize: '50', orderBy: '__name__' });
    if (cursor) params.set('pageToken', cursor);
    for (const field of ['legalHold', 'investigationHold', 'status', 'kind', 'retentionClass', 'relatedToActiveWork',
      'expiresAt', 'createdAt', 'updatedAt', 'lastMeaningfulContactAt', 'optedOutAt']) params.append('mask.fieldPaths', field);
    const response = await fetch(`${root}/${collection}?${params}`, {
      headers: { Authorization: 'Bearer owner' }, signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Emulator read failed for ' + collection + ' (HTTP ' + response.status + ').');
    const data = await response.json();
    return { documents: data.documents ?? [], nextPageToken: data.nextPageToken };
  },
});
console.log(JSON.stringify(report, null, 2));
