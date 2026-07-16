import { sanitizeEngineeringEvidence } from './sanitize-engineering-evidence.mjs';

const ANSI_COLOR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const CLASSIFIED_ROOT_CAUSE_PREFIX = 'ROOT-UNCLASSIFIED-';

const STAGE_CATEGORIES = [
  ['dependency-installation-lockfile', ['install', 'dependency', 'lockfile', 'pnpm', 'npm', 'yarn']],
  ['formatting', ['format', 'prettier']],
  ['eslint-static-analysis', ['lint', 'eslint']],
  ['typecheck-compilation', ['type-check', 'typecheck', 'typescript', 'compile', 'tsc']],
  ['unit-integration-tests', ['test', 'vitest', 'jest', 'playwright']],
  ['database-migration-live-behavior', ['database', 'migration', 'prisma', 'postgres', 'sql']],
  ['production-build', ['build', 'bundle', 'webpack', 'vite', 'next build']],
  ['runtime-workflow-behavior', ['runtime', 'exception', 'workflow']],
  ['github-tool-operation', ['github', 'pull request', 'issue', 'artifact', 'workflow']],
  ['documentation-evidence-management', ['evidence', 'ledger', 'documentation', 'governance']],
  ['security-finding', ['security', 'scanner', 'codeql', 'vulnerability']],
  ['performance-regression', ['performance', 'lcp', 'inp', 'cls', 'latency']],
];

function normalizedString(value) {
  return normalizeRootCauseEvidence(value).toLowerCase();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function confidenceForScore(score, deterministic) {
  if (deterministic || score >= 75) {
    return 'high';
  }
  if (score >= 40) {
    return 'medium';
  }
  return 'low';
}

function isClassifiedRootCause(rootCauseId) {
  return (
    typeof rootCauseId === 'string' &&
    rootCauseId.length > 0 &&
    !rootCauseId.startsWith(CLASSIFIED_ROOT_CAUSE_PREFIX)
  );
}

function fallbackRootCauseId(category) {
  return `${CLASSIFIED_ROOT_CAUSE_PREFIX}${category.toUpperCase().replaceAll('-', '_')}`;
}

function normalizeOccurrence(value) {
  const matchedSignatures = Array.isArray(value?.matchedSignatures)
    ? value.matchedSignatures
    : String(value?.['matched-signatures'] ?? '')
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    category: value?.category ?? value?.['failure-category'] ?? null,
    fingerprint: value?.fingerprint ?? null,
    matchedSignatures,
    prNumber: String(value?.prNumber ?? value?.['pr-number'] ?? 'none'),
    rootCauseId: value?.rootCauseId ?? value?.['root-cause-id'] ?? null,
    sourceId: String(value?.sourceId ?? value?.['source-id'] ?? 'none'),
  };
}

export function normalizeRootCauseEvidence(value) {
  return sanitizeEngineeringEvidence(value)
    .replaceAll(ANSI_COLOR_PATTERN, '')
    .replaceAll(/\b[0-9a-f]{40}\b/gi, '<sha>')
    .replaceAll(/\b[0-9a-f]{7,64}\b/gi, '<hex>')
    .replaceAll(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<timestamp>')
    .replaceAll(/\b\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<time>')
    .replaceAll(/\b\d+(?:\.\d+)?ms\b/g, '<duration>')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function validateRootCauseCatalog(catalog) {
  const errors = [];
  if (catalog === null || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new TypeError('Root-cause catalog must be an object.');
  }
  if (!Array.isArray(catalog.rootCauses) || catalog.rootCauses.length === 0) {
    throw new TypeError('Root-cause catalog must contain at least one root cause.');
  }

  const ids = new Set();
  const ledgerEntries = new Set();
  for (const [index, rootCause] of catalog.rootCauses.entries()) {
    const label = `rootCauses[${index}]`;
    if (rootCause === null || typeof rootCause !== 'object' || Array.isArray(rootCause)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    for (const field of [
      'id',
      'ledgerEntry',
      'category',
      'confidence',
      'rootCause',
      'unsuccessfulMethod',
      'successfulMethod',
      'preventionControl',
    ]) {
      if (typeof rootCause[field] !== 'string' || rootCause[field].trim().length === 0) {
        errors.push(`${label}.${field} must be a non-empty string.`);
      }
    }
    if (typeof rootCause.deterministic !== 'boolean') {
      errors.push(`${label}.deterministic must be a boolean.`);
    }
    if (!Array.isArray(rootCause.signatures) || rootCause.signatures.length === 0) {
      errors.push(`${label}.signatures must contain at least one signature.`);
    } else if (
      rootCause.signatures.some(
        (signature) => typeof signature !== 'string' || signature.trim().length === 0,
      )
    ) {
      errors.push(`${label}.signatures must contain only non-empty strings.`);
    }
    if (ids.has(rootCause.id)) {
      errors.push(`Duplicate root-cause ID: ${rootCause.id}.`);
    }
    if (ledgerEntries.has(rootCause.ledgerEntry)) {
      errors.push(`Duplicate ledger entry: ${rootCause.ledgerEntry}.`);
    }
    ids.add(rootCause.id);
    ledgerEntries.add(rootCause.ledgerEntry);
  }

  if (errors.length > 0) {
    throw new TypeError(`Invalid root-cause catalog:\n- ${errors.join('\n- ')}`);
  }
  return true;
}

export function inferFailureCategory(input) {
  const stage = normalizedString(
    [input?.workflowName, input?.jobName, input?.stepName, input?.sourceType]
      .filter(Boolean)
      .join(' '),
  );
  return (
    STAGE_CATEGORIES.find(([, keywords]) =>
      keywords.some((keyword) => stage.includes(keyword)),
    )?.[0] ?? 'unknown'
  );
}

function buildHypothesis(rootCause, lowerEvidence, inferredCategory) {
  const signatures = unique(rootCause.signatures.map((signature) => signature.trim()));
  const matchedSignatures = signatures.filter((signature) =>
    lowerEvidence.includes(signature.toLowerCase()),
  );
  if (matchedSignatures.length === 0) {
    return null;
  }

  const missingSignatures = signatures.filter((signature) => !matchedSignatures.includes(signature));
  const coverage = matchedSignatures.length / signatures.length;
  const categoryMatch = rootCause.category === inferredCategory;
  const completeDeterministicMatch =
    rootCause.deterministic && missingSignatures.length === 0 && matchedSignatures.length > 0;
  const score = Math.min(
    100,
    Math.round(25 + coverage * 60 + (categoryMatch ? 10 : 0) + (completeDeterministicMatch ? 5 : 0)),
  );
  const evidenceFor = matchedSignatures.map(
    (signature) => `Observed catalog signature: ${signature}`,
  );
  if (categoryMatch) {
    evidenceFor.push(`Failed stage maps to category: ${inferredCategory}`);
  }
  const evidenceAgainst = rootCause.deterministic
    ? missingSignatures.map((signature) => `Required deterministic signature was not observed: ${signature}`)
    : [];
  const missingEvidence = missingSignatures.map(
    (signature) => `Confirm whether the missing signature is present in complete evidence: ${signature}`,
  );

  return {
    category: rootCause.category,
    catalogConfidence: rootCause.confidence,
    catalogDeterministic: rootCause.deterministic,
    confidence: confidenceForScore(score, completeDeterministicMatch),
    deterministic: completeDeterministicMatch,
    evidenceAgainst,
    evidenceFor,
    ledgerEntry: rootCause.ledgerEntry,
    matchedSignatures,
    missingEvidence,
    missingSignatures,
    preventionControl: rootCause.preventionControl,
    rootCause: rootCause.rootCause,
    rootCauseId: rootCause.id,
    score,
    successfulMethod: rootCause.successfulMethod,
    unsuccessfulMethod: rootCause.unsuccessfulMethod,
  };
}

export function analyzeRootCause(input, catalog) {
  validateRootCauseCatalog(catalog);
  const combinedEvidence = normalizeRootCauseEvidence(
    [
      input?.workflowName,
      input?.jobName,
      input?.stepName,
      input?.sourceType,
      input?.logText,
      input?.summary,
      input?.details,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const lowerEvidence = combinedEvidence.toLowerCase();
  const inferredCategory = inferFailureCategory(input);
  const observedFacts = unique([
    input?.workflowName ? `Workflow: ${sanitizeEngineeringEvidence(input.workflowName)}` : null,
    input?.jobName ? `Job: ${sanitizeEngineeringEvidence(input.jobName)}` : null,
    input?.stepName ? `Step: ${sanitizeEngineeringEvidence(input.stepName)}` : null,
    input?.sourceType ? `Source: ${sanitizeEngineeringEvidence(input.sourceType)}` : null,
    `Inferred stage category: ${inferredCategory}`,
  ]);

  const hypotheses = catalog.rootCauses
    .map((rootCause) => buildHypothesis(rootCause, lowerEvidence, inferredCategory))
    .filter(Boolean)
    .sort((first, second) => second.score - first.score || first.rootCauseId.localeCompare(second.rootCauseId));

  if (hypotheses.length === 0) {
    const selected = {
      category: inferredCategory,
      catalogConfidence: 'low',
      catalogDeterministic: false,
      confidence: inferredCategory === 'unknown' ? 'low' : 'medium',
      deterministic: false,
      evidenceAgainst: [],
      evidenceFor:
        inferredCategory === 'unknown'
          ? []
          : [`Failed stage maps to category: ${inferredCategory}`],
      ledgerEntry: null,
      matchedSignatures: [],
      missingEvidence: ['Complete diagnostic evidence and a verified resolution are required.'],
      missingSignatures: [],
      preventionControl:
        'Confirm the root cause, add a regression control, and update the learning catalog.',
      rootCause:
        inferredCategory === 'unknown'
          ? 'The engine could not determine an evidence-supported root-cause candidate.'
          : `The failure occurred in the ${inferredCategory} stage; the exact cause requires confirmation.`,
      rootCauseId: fallbackRootCauseId(inferredCategory),
      score: inferredCategory === 'unknown' ? 0 : 20,
      successfulMethod:
        'Confirm the cause from complete evidence, apply one focused correction, and rerun the full pipeline.',
      unsuccessfulMethod:
        'Apply speculative corrections without confirming the failed step and evidence.',
    };
    return {
      ambiguous: false,
      deterministic: false,
      evidenceAgainst: selected.evidenceAgainst,
      evidenceFor: selected.evidenceFor,
      hypotheses: [selected],
      inferredCategory,
      missingEvidence: selected.missingEvidence,
      observedFacts,
      selected,
      status: 'candidate',
    };
  }

  const selected = hypotheses[0];
  const alternative = hypotheses[1];
  const ambiguous =
    alternative !== undefined &&
    selected.rootCauseId !== alternative.rootCauseId &&
    selected.score - alternative.score <= 5;
  const ambiguityEvidence = ambiguous
    ? [`Alternative ${alternative.rootCauseId} scored within five points of the selected cause.`]
    : [];
  const deterministic = selected.deterministic && !ambiguous;
  const evidenceAgainst = unique([...selected.evidenceAgainst, ...ambiguityEvidence]);
  const missingEvidence = unique([
    ...selected.missingEvidence,
    ...(ambiguous ? ['Resolve the competing root-cause hypothesis before confirmation.'] : []),
  ]);

  return {
    ambiguous,
    deterministic,
    evidenceAgainst,
    evidenceFor: selected.evidenceFor,
    hypotheses: hypotheses.slice(0, 5),
    inferredCategory,
    missingEvidence,
    observedFacts,
    selected: {
      ...selected,
      confidence: confidenceForScore(selected.score, deterministic),
      deterministic,
      evidenceAgainst,
      missingEvidence,
    },
    status: deterministic ? 'machine-supported' : 'candidate',
  };
}

export function compareRootCauseOccurrences(currentValue, previousValue) {
  const current = normalizeOccurrence(currentValue);
  const previous = normalizeOccurrence(previousValue);
  const evidence = [];

  if (
    current.fingerprint !== null &&
    current.fingerprint === previous.fingerprint &&
    current.sourceId === previous.sourceId &&
    current.prNumber === previous.prNumber
  ) {
    return {
      evidence: ['Fingerprint, source occurrence, and pull request are identical.'],
      relation: 'exact-occurrence',
      score: 100,
      sharedRootCause: true,
    };
  }

  const currentClassified = isClassifiedRootCause(current.rootCauseId);
  const previousClassified = isClassifiedRootCause(previous.rootCauseId);
  if (
    currentClassified &&
    previousClassified &&
    current.rootCauseId === previous.rootCauseId
  ) {
    evidence.push(`Both occurrences use classified root-cause ID ${current.rootCauseId}.`);
    return {
      evidence,
      relation: 'shared-root-cause',
      score: 95,
      sharedRootCause: true,
    };
  }

  if (currentClassified && previousClassified && current.rootCauseId !== previous.rootCauseId) {
    return {
      evidence: [
        `Classified root-cause IDs differ: ${current.rootCauseId} and ${previous.rootCauseId}.`,
      ],
      relation: 'unrelated',
      score: 0,
      sharedRootCause: false,
    };
  }

  const signatureOverlap = current.matchedSignatures.filter((signature) =>
    previous.matchedSignatures.includes(signature),
  );
  if (signatureOverlap.length > 0) {
    evidence.push(`Occurrences share ${signatureOverlap.length} observed signature(s).`);
  }
  if (current.category !== null && current.category === previous.category) {
    evidence.push(`Occurrences share category ${current.category}.`);
  }

  return {
    evidence: [
      ...evidence,
      'Unclassified or incomplete evidence cannot establish a shared root cause.',
    ],
    relation: 'insufficient-evidence',
    score: Math.min(60, signatureOverlap.length * 20 + (current.category === previous.category ? 10 : 0)),
    sharedRootCause: false,
  };
}

export function verifyRootCauseExplanation({ assessment, diagnosis, availableEvidence = [] }) {
  const errors = [];
  const warnings = [];
  const selected = assessment?.selected;
  if (selected === undefined) {
    errors.push('No selected root-cause assessment is available.');
  }

  const rootCauseId = diagnosis?.rootCauseId;
  if (selected !== undefined && rootCauseId !== selected.rootCauseId) {
    errors.push('The written root-cause ID does not match the selected evidence-backed hypothesis.');
  }
  if (!isClassifiedRootCause(rootCauseId)) {
    errors.push('An unclassified root cause cannot be verified as confirmed.');
  }

  const rootCauseStatus = diagnosis?.rootCauseStatus;
  if (!['confirmed', 'machine-supported'].includes(rootCauseStatus)) {
    errors.push('Root-cause status must be confirmed or machine-supported.');
  }
  if (rootCauseStatus === 'machine-supported') {
    if (assessment?.deterministic !== true || assessment?.evidenceAgainst?.length > 0) {
      errors.push('Machine-supported status requires deterministic evidence without contradictions.');
    }
  }
  if (rootCauseStatus === 'confirmed') {
    if (String(diagnosis?.confirmedRootCause ?? '').trim().length < 12) {
      errors.push('Confirmed root cause must contain a specific evidence-backed explanation.');
    }
    if (diagnosis?.resolutionStatus !== 'verified') {
      errors.push('Confirmed root cause requires a verified resolution status.');
    }
    if (String(diagnosis?.successfulVerification ?? '').trim().length < 12) {
      errors.push('Confirmed root cause requires successful verification evidence.');
    }
    if (String(diagnosis?.reviewerConfirmation ?? '').trim().length < 8) {
      errors.push('Confirmed root cause requires reviewer confirmation.');
    }
    const fixCommit = String(diagnosis?.fixCommit ?? '');
    if (!/^[0-9a-f]{40}$/i.test(fixCommit) && !fixCommit.startsWith('not-applicable:')) {
      errors.push('Fix commit must be a full SHA or an explicit not-applicable explanation.');
    }
  }

  const evidenceReferences = unique(diagnosis?.evidenceReferences ?? []);
  if (availableEvidence.length > 0) {
    const missingReferences = evidenceReferences.filter(
      (reference) => !availableEvidence.includes(reference),
    );
    if (missingReferences.length > 0) {
      errors.push(`Written explanation references unavailable evidence: ${missingReferences.join(', ')}.`);
    }
  }
  if (evidenceReferences.length === 0) {
    warnings.push('No explicit evidence references were supplied to the explanation verifier.');
  }
  if (assessment?.ambiguous === true) {
    warnings.push('The selected cause has a competing hypothesis and still requires human review.');
  }

  return {
    errors,
    machineEvidenceVerified:
      rootCauseStatus === 'machine-supported' &&
      assessment?.deterministic === true &&
      assessment?.evidenceAgainst?.length === 0,
    semanticTruthVerified: false,
    status: errors.length > 0 ? 'unsupported' : warnings.length > 0 ? 'partially-supported' : 'supported',
    warnings,
  };
}

export function evaluateLearningOutcome({
  declaredOutcome,
  observableEvents = [],
  failedRuns = [],
  linkedIssues = [],
}) {
  const evidenceCount = observableEvents.length + failedRuns.length + linkedIssues.length;
  const errors = [];
  const warnings = [];

  if (!['new', 'existing', 'none'].includes(declaredOutcome)) {
    errors.push('Learning outcome must be new, existing, or none.');
  }
  if (declaredOutcome === 'none' && evidenceCount > 0) {
    errors.push(
      `Learning outcome cannot be none while ${evidenceCount} observable failure occurrence(s) exist.`,
    );
  }
  if ((declaredOutcome === 'new' || declaredOutcome === 'existing') && evidenceCount === 0) {
    warnings.push('A learning outcome was declared without observable linked failure evidence.');
  }

  return {
    allowed: errors.length === 0,
    errors,
    evidenceCount,
    warnings,
  };
}
