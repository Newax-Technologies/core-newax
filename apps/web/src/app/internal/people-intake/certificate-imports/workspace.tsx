'use client';

import { useState, type FormEvent } from 'react';

interface EvidenceItem {
  id: string;
  file_name: string;
  mime_type: string;
  document_type: string;
  certificate_import_id: string | null;
  certificate_import_status: string | null;
}

const emptyPayload = JSON.stringify({ schemaVersion: 1, people: [], relationships: [] }, null, 2);

export function CertificateImportWorkspace() {
  const [intakeId, setIntakeId] = useState('');
  const [fileId, setFileId] = useState('');
  const [documentType, setDocumentType] = useState('birth_certificate');
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [importId, setImportId] = useState('');
  const [payload, setPayload] = useState(emptyPayload);
  const [message, setMessage] = useState('Enter an intake ID to begin.');

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      credentials: 'same-origin',
    });
    const body = await response.json();
    if (!response.ok || body.success !== true) {
      throw new Error(body?.error?.message ?? 'The request failed.');
    }
    return body.data;
  }

  async function loadEvidence() {
    const data = await request(
      `/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence`,
    );
    setItems(data);
    setMessage(`Loaded ${String(data.length)} evidence record(s).`);
  }

  async function attach(event: FormEvent) {
    event.preventDefault();
    await request(
      `/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence`,
      {
        method: 'POST',
        body: JSON.stringify({ file_id: fileId, document_type: documentType }),
      },
    );
    setFileId('');
    await loadEvidence();
  }

  async function createImport(evidenceId: string) {
    const data = await request(
      `/api/core/organizations/current/people-intakes/${encodeURIComponent(intakeId)}/evidence/${encodeURIComponent(evidenceId)}/certificate-imports`,
      { method: 'POST', body: '{}' },
    );
    setImportId(data.id);
    setMessage(`Certificate import ${data.id} created.`);
    await loadEvidence();
  }

  async function extract(event: FormEvent) {
    event.preventDefault();
    const data = await request(
      `/api/core/organizations/current/people-intakes/certificate-imports/${encodeURIComponent(importId)}/extraction`,
      {
        method: 'PUT',
        body: JSON.stringify({
          expected_version: 1,
          extractor_code: 'manual',
          extraction_version: '1',
          confidence_bps: 10000,
          payload: JSON.parse(payload),
        }),
      },
    );
    setMessage(
      `Extraction staged at version ${String(data.version)}. It now requires independent review.`,
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
      <p>
        <a href="/internal/people-intake">← Family intake dashboard</a>
      </p>
      <h1>Certificate import and evidence</h1>
      <p>
        Attach an existing NEWAX File record, stage extracted family data, and send it for
        independent verification. No extraction writes directly to the People Registry.
      </p>
      <p role="status">{message}</p>

      <section>
        <h2>Evidence attachment</h2>
        <form onSubmit={attach} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
          <label>
            Intake ID
            <input
              value={intakeId}
              onChange={(event) => setIntakeId(event.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Registered File ID
            <input
              value={fileId}
              onChange={(event) => setFileId(event.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Document type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              <option value="birth_certificate">Birth certificate</option>
              <option value="crc">CRC</option>
              <option value="family_registration_certificate">
                Family registration certificate
              </option>
              <option value="marriage_certificate">Marriage certificate</option>
              <option value="guardianship_order">Guardianship order</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div>
            <button type="submit">Attach evidence</button>{' '}
            <button type="button" onClick={() => void loadEvidence()}>
              Load evidence
            </button>
          </div>
        </form>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.file_name}</strong> · {item.document_type} ·{' '}
              {item.certificate_import_status ?? 'not imported'}{' '}
              {item.certificate_import_id === null ? (
                <button type="button" onClick={() => void createImport(item.id)}>
                  Create import
                </button>
              ) : (
                <button type="button" onClick={() => setImportId(item.certificate_import_id ?? '')}>
                  Open import
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Structured extraction</h2>
        <form onSubmit={extract} style={{ display: 'grid', gap: 12 }}>
          <label>
            Certificate import ID
            <input
              value={importId}
              onChange={(event) => setImportId(event.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Extracted family payload
            <textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              rows={20}
              style={{ width: '100%', fontFamily: 'monospace' }}
            />
          </label>
          <button type="submit">Stage extraction</button>
        </form>
      </section>
    </main>
  );
}
