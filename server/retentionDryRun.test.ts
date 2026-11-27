import { describe, expect, it, vi } from 'vitest';
import { classifyRetention, prepareSuppression, retentionTarget, runRetentionDryRun } from './lib/retentionDryRun';

const now = Date.parse('2026-11-27T00:00:00Z');
const longAgo = '2024-01-01T00:00:00Z';
const policy = { leadDays: 365, partnerDays: 365, quotaGraceHours: 24, auditDays: 365 };
const config = { ...retentionTarget, host: '127.0.0.1:8085', now, policy };

describe('retention dry run', () => {
  it('separates aged records, active work, suppressions, holds and unknown audit metadata', () => {
    const lead = { kind: 'interest', status: 'New', createdAt: longAgo };
    expect(classifyRetention('growthLeads', lead, now, policy)).toBe('interest-expired');
    expect(classifyRetention('growthLeads', { ...lead, kind: 'partner' }, now, policy)).toBe('partner-expired');
    expect(classifyRetention('growthLeads', { ...lead, status: 'Converted' }, now, policy)).toBe('retain');
    expect(classifyRetention('growthLeads', { ...lead, status: 'Opted out' }, now, policy)).toBe('preserve-suppression');
    expect(classifyRetention('growthLeads', { ...lead, investigationHold: true }, now, policy)).toBe('hold');
    expect(classifyRetention('growthLeads', { ...lead, legalHold: true }, now, policy)).toBe('hold');
    expect(classifyRetention('growthLeads', { ...lead, updatedAt: new Date(now).toISOString() }, now, policy)).toBe('retain');
    expect(classifyRetention('growthRateLimits', { expiresAt: longAgo }, now, policy)).toBe('quota-expired');
    expect(classifyRetention('growthRateLimits', { expiresAt: '2026-11-26T23:00:00Z' }, now, policy)).toBe('retain');
    expect(classifyRetention('auditLogs', { createdAt: longAgo }, now, policy)).toBe('needs-review');
    expect(classifyRetention('auditLogs', { createdAt: longAgo, retentionClass: 'security-metadata', relatedToActiveWork: false }, now, policy)).toBe('audit-expired');
  });

  it('rejects other targets before reading', async () => {
    const readPage = vi.fn();
    await expect(runRetentionDryRun({ ...config, projectId: 'other-project', readPage })).rejects.toThrow('dedicated demo');
    await expect(runRetentionDryRun({ ...config, host: 'firestore.googleapis.com:443', readPage })).rejects.toThrow('loopback');
    expect(readPage).not.toHaveBeenCalled();
  });

  it('retains only the keyed identifier, scope and event date for a suppression proposal', () => {
    const fields = { status: 'Opted out', kind: 'partner', updatedAt: longAgo, email: 'synthetic@example.invalid' };
    const digest = 'a'.repeat(64);
    expect(prepareSuppression(digest, fields)).toEqual({ digest, scope: 'partner', optedOutAt: longAgo });
    expect(prepareSuppression('untrusted-id', fields)).toBeNull();
    expect(prepareSuppression(digest, { ...fields, status: 'Follow-up' })).toBeNull();
  });

  it('bounds page reads, reports aggregate counts and detects update-time changes', async () => {
    const name = 'projects/demo-daytech-milestone/databases/(default)/documents/growthLeads/synthetic-id';
    const read = (updateTime: string) => async (collection: string, cursor?: string) => ({
      documents: collection === 'growthLeads' && !cursor ? [{
        name, updateTime, fields: {
          status: { stringValue: 'New' }, kind: { stringValue: 'interest' },
          createdAt: { timestampValue: longAgo }, email: { stringValue: 'synthetic@example.invalid' },
        },
      }] : [],
      nextPageToken: collection === 'growthLeads' ? String(Number(cursor ?? 0) + 1) : undefined,
    });
    const readPage = vi.fn(read(longAgo));
    const first = await runRetentionDryRun({ ...config, readPage });
    const second = await runRetentionDryRun({ ...config, readPage: read('2024-01-02T00:00:00Z') });
    expect(first).toMatchObject({ writes: 0, counts: { growthLeads: { examined: 1, truncated: true, dispositions: { 'interest-expired': 1 } } } });
    expect(readPage).toHaveBeenCalledTimes(12);
    expect(first.snapshotDigest).not.toEqual(second.snapshotDigest);
    expect(JSON.stringify(first)).not.toMatch(/synthetic-id|example\.invalid/);
  });
});
