import { parseIssueNumbers, parsePullRequestField } from './engineering-learning-core.mjs';
import { normalizeString, uniqueStrings } from './prevention-engine-support.mjs';

function splitList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBlocks(body, blockName) {
  const expression = new RegExp(`<!-- ${blockName}\\n([\\s\\S]*?)\\n-->`, 'g');
  return [...String(body ?? '').matchAll(expression)].map((match) =>
    Object.fromEntries(
      match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const separator = line.indexOf(':');
          return separator === -1
            ? [line.toLowerCase(), '']
            : [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()];
        }),
    ),
  );
}

function extractListField(body, label) {
  const match = String(body ?? '').match(new RegExp(`^-\\s*${label}:\\s*(.+)$`, 'im'));
  if (match !== null) return match[1].replaceAll('`', '').trim();
  const lines = String(body ?? '').split('\n');
  const line = lines.find((entry) =>
    entry.trim().toLowerCase().startsWith(`- ${label.toLowerCase()}:`),
  );
  return line === undefined ? '' : line.slice(line.indexOf(':') + 1).replaceAll('`', '').trim();
}

function eventFromMetadata(metadata, source, createdAt, issueNumber) {
  return {
    id: metadata['event-id'] ?? metadata.id ?? `issue-${issueNumber}`,
    issueNumber,
    rootCauseId: metadata['root-cause-id'],
    ledgerEntry: metadata['ledger-entry'],
    category: metadata.category,
    status: metadata.status,
    rootCauseStatus: metadata['root-cause-status'],
    resolutionStatus: metadata['resolution-status'],
    resolvedAt: metadata['resolved-at'] ?? metadata.at ?? createdAt,
    fixCommit: metadata['fix-commit'],
    reviewer: metadata.reviewer,
    reviewedAt: metadata['reviewed-at'],
    verificationRefs: splitList(metadata['verification-refs']),
    regressionRefs: splitList(metadata['regression-refs']),
    preventionControl: metadata['prevention-control'],
    successfulMethod: metadata['successful-method'],
    unsuccessfulMethod: metadata['unsuccessful-method'],
    evidenceRefs: splitList(metadata['evidence-refs']),
    source,
  };
}

function legacyFromIssue(issue, source) {
  const body = issue.body ?? '';
  const engineering = parseBlocks(body, 'newax-engineering-event').at(-1) ?? {};
  const rootCauseStatus =
    extractListField(body, 'Root-cause status') || engineering['root-cause-status'];
  const resolutionStatus = extractListField(body, 'Resolution status');
  const reviewer = extractListField(body, 'Reviewer confirmation');
  const fixCommit = extractListField(body, 'Fix commit') || engineering['commit-sha'];
  const verification = extractListField(body, 'Successful verification');
  const ledgerEntry = extractListField(body, 'Ledger entry');
  const preventionControl = extractListField(body, 'Prevention control');
  if (normalizeString(engineering['root-cause-id']).length === 0) return null;
  return {
    id: `issue-${issue.number}`,
    issueNumber: Number(issue.number),
    rootCauseId: engineering['root-cause-id'],
    ledgerEntry,
    category: engineering['failure-category'],
    status: issue.state,
    rootCauseStatus,
    resolutionStatus,
    resolvedAt: issue.closed_at ?? null,
    fixCommit,
    reviewer,
    reviewedAt: extractListField(body, 'Reviewed at'),
    verificationRefs: verification.length === 0 ? [] : [verification],
    regressionRefs: splitList(extractListField(body, 'Regression evidence')),
    preventionControl,
    successfulMethod: extractListField(body, 'Successful method'),
    unsuccessfulMethod: extractListField(body, 'Unsuccessful method'),
    evidenceRefs: [`issue:${issue.number}`],
    source,
  };
}

export function parseResolvedMistakes(issue, comments = []) {
  const source = `issue:${issue.number}`;
  const createdAt = issue.created_at ?? issue.createdAt ?? null;
  const events = [
    ...parseBlocks(issue.body ?? '', 'newax-prevention-event').map((metadata) =>
      eventFromMetadata(metadata, source, createdAt, Number(issue.number)),
    ),
    ...comments.flatMap((comment) =>
      parseBlocks(comment.body ?? '', 'newax-prevention-event').map((metadata) =>
        eventFromMetadata(
          metadata,
          `issue-${issue.number}-comment:${comment.id ?? 'unknown'}`,
          comment.created_at ?? comment.createdAt ?? null,
          Number(issue.number),
        ),
      ),
    ),
  ];
  if (events.length > 0) return events;
  const legacy = legacyFromIssue(issue, source);
  return legacy === null ? [] : [legacy];
}

export function parsePreventionIssueNumbers(pullRequestBody) {
  const values = [
    parsePullRequestField(pullRequestBody, '- Prevention records:'),
    parsePullRequestField(pullRequestBody, '- Learning issues:'),
  ];
  return [...new Set(values.flatMap((value) => (value === null ? [] : parseIssueNumbers(value))))];
}

export function parsePreventionPackReferences(body) {
  return uniqueStrings(
    parseBlocks(body, 'newax-prevention-pack').flatMap((metadata) => splitList(metadata.paths)),
  );
}
