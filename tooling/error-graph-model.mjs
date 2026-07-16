import {
  ERROR_GRAPH_CAUSAL_EDGE_TYPES,
  ERROR_GRAPH_EDGE_TYPES,
  ERROR_GRAPH_STATUSES,
  ERROR_GRAPH_VERIFIED_STATUSES,
  causeNodeIdForRootCause,
  cleanGraphArray,
  cleanGraphText,
  impactNodeIdForEvent,
  normalizeErrorImpacts,
  normalizeGraphEdgeType,
  normalizeGraphStatus,
  normalizeRelationshipHints,
  occurrenceNodeIdForEvent,
} from './error-graph-normalization.mjs';

export {
  ERROR_GRAPH_CAUSAL_EDGE_TYPES,
  ERROR_GRAPH_EDGE_TYPES,
  ERROR_GRAPH_STATUSES,
  ERROR_GRAPH_VERIFIED_STATUSES,
  causeNodeIdForRootCause,
  impactNodeIdForEvent,
  normalizeErrorImpacts,
  normalizeRelationshipHints,
  occurrenceNodeIdForEvent,
};

function statusRank(status) {
  return status === 'confirmed' ? 3 : status === 'machine-supported' ? 2 : 1;
}

function mergeNode(existing, incoming) {
  if (existing === undefined) {
    return incoming;
  }
  return {
    ...existing,
    ...incoming,
    evidence: Array.from(new Set([...(existing.evidence ?? []), ...(incoming.evidence ?? [])])),
    status: statusRank(incoming.status) > statusRank(existing.status) ? incoming.status : existing.status,
  };
}

function edgeKey(edge) {
  return `${edge.from}\u0000${edge.type}\u0000${edge.to}`;
}

function mergeEdge(existing, incoming) {
  if (existing === undefined) {
    return incoming;
  }
  return {
    ...existing,
    evidence: Array.from(new Set([...(existing.evidence ?? []), ...(incoming.evidence ?? [])])),
    status: statusRank(incoming.status) > statusRank(existing.status) ? incoming.status : existing.status,
  };
}

function eventStatus(event) {
  return normalizeGraphStatus(
    event?.status ?? (event?.rootCauseDeterministic === true ? 'machine-supported' : 'candidate'),
  );
}

function contextForEvent(event) {
  return {
    repository: cleanGraphText(event.repository, 'repository', 500),
    prNumber: event.prNumber ?? null,
    commitSha: cleanGraphText(event.commitSha, 'commitSha', 80),
    workflowRunId: event.workflowRunId ?? null,
    sourceType: cleanGraphText(event.sourceType, 'sourceType', 120),
    sourceId: cleanGraphText(event.sourceId, 'sourceId', 500),
  };
}

function resolveParentNodeId(hint) {
  if (hint.referenceType === 'parentNodeId') {
    return hint.referenceValue;
  }
  if (hint.referenceType === 'parentFingerprint') {
    return `occurrence:${hint.referenceValue}`;
  }
  return causeNodeIdForRootCause(hint.referenceValue);
}

function addObservedImpact(impacts, event) {
  if (event.sourceType !== 'ci-workflow' || event.workflowRunId === null) {
    return impacts;
  }
  const id = `ci-failure-${event.workflowRunId}`;
  if (impacts.some((impact) => impact.id === id)) {
    return impacts;
  }
  return [
    ...impacts,
    {
      id,
      kind: 'workflow-failure',
      label: `${event.workflowName ?? 'Continuous Integration'} failed`,
      parentImpactId: null,
      type: 'causes',
      status: 'machine-supported',
      evidence: [`Observed failed workflow run ${event.workflowRunId}.`],
    },
  ];
}

function validateCausalCycles(nodes, edges) {
  const adjacency = new Map([...nodes.keys()].map((nodeId) => [nodeId, []]));
  for (const edge of edges.values()) {
    if (ERROR_GRAPH_CAUSAL_EDGE_TYPES.has(edge.type)) {
      adjacency.get(edge.from)?.push(edge.to);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(nodeId) {
    if (visiting.has(nodeId)) {
      const start = stack.indexOf(nodeId);
      const cycle = [...stack.slice(start), nodeId];
      throw new TypeError(`Error relationship graph contains a causal cycle: ${cycle.join(' -> ')}.`);
    }
    if (visited.has(nodeId)) {
      return;
    }
    visiting.add(nodeId);
    stack.push(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) {
      visit(next);
    }
    stack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  for (const nodeId of adjacency.keys()) {
    visit(nodeId);
  }
}

export function buildErrorRelationshipGraph(eventValues, options = {}) {
  if (!Array.isArray(eventValues)) {
    throw new TypeError('Error relationship graph input must be an array of engineering events.');
  }
  const nodes = new Map();
  const edges = new Map();
  const normalizedEvents = eventValues.map((event) => {
    if (event === null || typeof event !== 'object' || Array.isArray(event)) {
      throw new TypeError('Every graph event must be an object.');
    }
    return {
      ...event,
      relationshipHints: normalizeRelationshipHints(event.relationshipHints ?? event.relationships),
      impacts: normalizeErrorImpacts(event.impacts),
    };
  });

  function addNode(node) {
    nodes.set(node.id, mergeNode(nodes.get(node.id), node));
  }
  function addEdge(edge) {
    edges.set(edgeKey(edge), mergeEdge(edges.get(edgeKey(edge)), edge));
  }

  for (const event of normalizedEvents) {
    const occurrenceId = occurrenceNodeIdForEvent(event);
    const causeId = causeNodeIdForRootCause(event.rootCauseId ?? 'ROOT-UNCLASSIFIED-UNKNOWN');
    const status = eventStatus(event);
    const context = contextForEvent(event);
    addNode({
      id: causeId,
      kind: 'root-cause',
      label: cleanGraphText(event.rootCauseCandidate ?? event.rootCauseId, 'rootCauseCandidate', 1_000),
      rootCauseId: event.rootCauseId ?? 'ROOT-UNCLASSIFIED-UNKNOWN',
      category: event.category ?? 'unknown',
      status,
      evidence: event.matchedSignatures ?? [],
      context: null,
    });
    addNode({
      id: occurrenceId,
      kind: 'occurrence',
      label: cleanGraphText(event.symptom ?? event.stepName ?? event.fingerprint, 'symptom', 1_000),
      fingerprint: event.fingerprint,
      rootCauseId: event.rootCauseId ?? 'ROOT-UNCLASSIFIED-UNKNOWN',
      category: event.category ?? 'unknown',
      status,
      evidence: event.rootCauseAssessment?.observedFacts ?? [],
      context,
    });
    addEdge({
      from: causeId,
      to: occurrenceId,
      type: 'causes',
      status,
      evidence:
        event.rootCauseAssessment?.evidenceFor?.length > 0
          ? event.rootCauseAssessment.evidenceFor
          : ['The occurrence carries this root-cause classification.'],
      source: 'classification',
    });

    for (const hint of event.relationshipHints) {
      const parentId = resolveParentNodeId(hint);
      if (!nodes.has(parentId)) {
        addNode({
          id: parentId,
          kind: hint.referenceType === 'parentRootCauseId' ? 'root-cause' : 'occurrence-reference',
          label: `Referenced upstream node ${hint.referenceValue}`,
          rootCauseId: hint.referenceType === 'parentRootCauseId' ? hint.referenceValue : null,
          category: 'unknown',
          status: hint.status,
          evidence: hint.evidence,
          context: null,
        });
      }
      addEdge({
        from: parentId,
        to: hint.referenceType === 'parentRootCauseId' ? causeId : occurrenceId,
        type: hint.type,
        status: hint.status,
        evidence: hint.evidence,
        source: 'explicit-relationship',
      });
    }

    const impacts = addObservedImpact(event.impacts, event);
    for (const impact of impacts) {
      const impactId = impactNodeIdForEvent(event, impact.id);
      const parentId =
        impact.parentImpactId === null
          ? occurrenceId
          : impactNodeIdForEvent(event, impact.parentImpactId);
      addNode({
        id: impactId,
        kind: impact.kind,
        label: impact.label,
        status: impact.status,
        evidence: impact.evidence,
        context,
      });
      addEdge({
        from: parentId,
        to: impactId,
        type: impact.type,
        status: impact.status,
        evidence: impact.evidence,
        source: 'observed-impact',
      });
    }
  }

  for (const edge of options.explicitEdges ?? []) {
    if (edge === null || typeof edge !== 'object' || Array.isArray(edge)) {
      throw new TypeError('Every explicit graph edge must be an object.');
    }
    addEdge({
      from: cleanGraphText(edge.from, 'explicit edge from', 1_000),
      to: cleanGraphText(edge.to, 'explicit edge to', 1_000),
      type: normalizeGraphEdgeType(edge.type),
      status: normalizeGraphStatus(edge.status),
      evidence: cleanGraphArray(edge.evidence, 'explicit edge evidence'),
      source: 'explicit-edge',
    });
  }

  for (const edge of edges.values()) {
    if (!nodes.has(edge.from)) {
      throw new TypeError(`Error relationship edge references missing parent node: ${edge.from}.`);
    }
    if (!nodes.has(edge.to)) {
      throw new TypeError(`Error relationship edge references missing child node: ${edge.to}.`);
    }
  }
  validateCausalCycles(nodes, edges);
  return {
    version: 1,
    nodes: [...nodes.values()].sort((first, second) => first.id.localeCompare(second.id)),
    edges: [...edges.values()].sort((first, second) => edgeKey(first).localeCompare(edgeKey(second))),
  };
}
