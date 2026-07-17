import { parseIssueNumbers, parsePullRequestField } from './engineering-learning-core.mjs';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function splitList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseKeyValueBlocks(body, blockName) {
  const expression = new RegExp(`<!-- ${blockName}\n([\s\S]*?)\n-->`, 'g');
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

function extractHeadingValue(body, heading) {
  const lines = String(body ?? '').split('\n');
  const target = heading.trim().toLowerCase();
  const start = lines.findIndex((line) => {
    const match = line.match(/^#{2,4}\s+(.+)$/);
    return match !== null && match[1].trim().toLowerCase() === target;
  });
  if (start === -1) return '';
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{2,4}\s+/.test(lines[index])) break;
    if (lines[index].trim().length > 0) values.push(lines[index].trim());
  }
  return values.join('\n').replace(/^```[^\n]*\n?|```$/g, '').trim();
}

function eventFromMetadata(metadata, source, createdAt) {
  return {
    id: metadata['event-id'] ?? metadata.id,
    type: metadata.event ?? metadata.type,
    outputId: metadata['output-id'],
    status: metadata.status,
    at: metadata.at ?? createdAt,
    effectiveAt: metadata['effective-at'],
    provider: metadata.provider,
    model: metadata.model,
    tool: metadata.tool,
    toolVersion: metadata['tool-version'],
    sourceKind: metadata['source-kind'],
    promptHash: metadata['prompt-hash'],
    outputHash: metadata['output-hash'],
    artifactRefs: splitList(metadata['artifact-refs']),
    framework: metadata.framework,
    frameworkVersion: metadata['framework-version'],
    pinnedVersion: metadata['pinned-version'],
    documentationVersion: metadata['documentation-version'],
    symbol: metadata.symbol,
    claim: metadata.claim,
    expected: metadata.expected,
    actual: metadata.actual,
    packageName: metadata['package-name'],
    packageVersion: metadata['package-version'],
    replacement: metadata.replacement,
    policyId: metadata['policy-id'],
    validationKind: metadata['validation-kind'],
    validationCode: metadata['validation-code'],
    validationRef: metadata['validation-ref'],
    copiedFrom: metadata['copied-from'],
    staleIdentifiers: splitList(metadata['stale-identifiers']),
    generated: metadata.generated,
    materialImpact: metadata['material-impact'],
    confirmsMistake: metadata['confirms-mistake'],
    references: splitList(metadata.references),
    resolves: splitList(metadata.resolves),
    findingType: metadata['finding-type'],
    severity: metadata.severity,
    reviewer: metadata.reviewer,
    reason: metadata.reason,
    correctionCommit: metadata['correction-commit'],
    regressionTest: metadata['regression-test'],
    regressionRun: metadata['regression-run'],
    source,
  };
}

function eventFromIssueForm(body, source, createdAt) {
  const id = extractHeadingValue(body, 'Event ID');
  const type = extractHeadingValue(body, 'Event type');
  if (id.length === 0 || type.length === 0) return null;
  return {
    id,
    type,
    outputId: extractHeadingValue(body, 'Output ID'),
    status: extractHeadingValue(body, 'Status'),
    at: extractHeadingValue(body, 'Occurrence time') || createdAt,
    effectiveAt: extractHeadingValue(body, 'Effective time'),
    provider: extractHeadingValue(body, 'Provider'),
    model: extractHeadingValue(body, 'Model'),
    tool: extractHeadingValue(body, 'Tool'),
    toolVersion: extractHeadingValue(body, 'Tool version'),
    sourceKind: extractHeadingValue(body, 'Source kind'),
    promptHash: extractHeadingValue(body, 'Prompt hash'),
    outputHash: extractHeadingValue(body, 'Output hash'),
    artifactRefs: splitList(extractHeadingValue(body, 'Artifact references')),
    framework: extractHeadingValue(body, 'Framework'),
    frameworkVersion: extractHeadingValue(body, 'Framework version'),
    pinnedVersion: extractHeadingValue(body, 'Pinned version'),
    documentationVersion: extractHeadingValue(body, 'Documentation version'),
    symbol: extractHeadingValue(body, 'Symbol'),
    claim: extractHeadingValue(body, 'Claim'),
    expected: extractHeadingValue(body, 'Expected'),
    actual: extractHeadingValue(body, 'Actual'),
    packageName: extractHeadingValue(body, 'Package name'),
    packageVersion: extractHeadingValue(body, 'Package version'),
    replacement: extractHeadingValue(body, 'Replacement'),
    policyId: extractHeadingValue(body, 'Policy ID'),
    validationKind: extractHeadingValue(body, 'Validation kind'),
    validationCode: extractHeadingValue(body, 'Validation code'),
    validationRef: extractHeadingValue(body, 'Validation reference'),
    copiedFrom: extractHeadingValue(body, 'Copied from'),
    staleIdentifiers: splitList(extractHeadingValue(body, 'Stale identifiers')),
    generated: extractHeadingValue(body, 'Generated'),
    materialImpact: extractHeadingValue(body, 'Material impact'),
    confirmsMistake: extractHeadingValue(body, 'Confirms mistake'),
    references: splitList(extractHeadingValue(body, 'References')),
    resolves: splitList(extractHeadingValue(body, 'Resolves')),
    findingType: extractHeadingValue(body, 'Finding type'),
    severity: extractHeadingValue(body, 'Severity'),
    reviewer: extractHeadingValue(body, 'Reviewer'),
    reason: extractHeadingValue(body, 'Reason'),
    correctionCommit: extractHeadingValue(body, 'Correction commit'),
    regressionTest: extractHeadingValue(body, 'Regression test'),
    regressionRun: extractHeadingValue(body, 'Regression run'),
    source,
  };
}

export function parseAiQualityEvents(body, context = {}) {
  const source = normalizeString(context.source) || 'unknown';
  const createdAt = context.createdAt ?? null;
  const events = parseKeyValueBlocks(body, 'newax-ai-quality-event').map((metadata) =>
    eventFromMetadata(metadata, source, createdAt),
  );
  const form = eventFromIssueForm(body, source, createdAt);
  if (form !== null && !events.some((event) => event.id === form.id)) events.push(form);
  return events;
}

export function parseAiQualityIssueNumbers(pullRequestBody) {
  const field = parsePullRequestField(pullRequestBody, '- AI quality issues:');
  if (field !== null) return parseIssueNumbers(field);
  return [
    ...new Set(
      [...String(pullRequestBody ?? '').matchAll(/AI quality issue(?:s)?\s*[:#]?\s*#(\d+)/gi)]
        .map((match) => Number(match[1]))
        .filter(Number.isSafeInteger),
    ),
  ];
}
