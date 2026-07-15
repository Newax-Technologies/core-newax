from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


path = Path("apps/web/src/app/internal/people-intake/people-intake-dashboard.tsx")
text = path.read_text()
text = replace_once(
    text,
    "  readonly review_notes: string | null;\n}",
    "  readonly review_notes: string | null;\n  readonly updated_at: string;\n}",
    "summary updated timestamp",
)
text = replace_once(
    text,
    "  const reviewQueue = intakes.filter((item) => item.status === 'submitted');",
    "  const savedDrafts = intakes.filter((item) => item.status === 'draft');\n  const reviewQueue = intakes.filter((item) => item.status === 'submitted');",
    "saved draft projection",
)
text = replace_once(
    text,
    """  function updateRelationship(localIdValue: string, patch: Partial<DraftRelationship>): void {
    setDraft((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) =>
        relationship.localId === localIdValue ? { ...relationship, ...patch } : relationship,
      ),
    }));
  }

  async function saveDraft(): Promise<void> {
""",
    """  function updateRelationship(localIdValue: string, patch: Partial<DraftRelationship>): void {
    setDraft((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) =>
        relationship.localId === localIdValue ? { ...relationship, ...patch } : relationship,
      ),
    }));
  }

  function changeMembership(nextMembershipId: string): void {
    setMembershipId(nextMembershipId);
    setIntakes([]);
    setDraft(initialFamilyIntakeDraft());
    setReviewRecord(null);
    setReviewNotes('');
    setMessage({
      tone: 'neutral',
      text:
        nextMembershipId.length === 0
          ? 'Select an organization to begin.'
          : 'Organization changed. A new unsaved draft is ready.',
    });
  }

  async function saveDraft(): Promise<void> {
""",
    "membership reset function",
)
text = replace_once(
    text,
    """  async function openReview(id: string): Promise<void> {
""",
    """  async function openDraft(id: string): Promise<void> {
    setBusy(true);
    try {
      const record = await request<IntakeRecord>(
        `/api/core/organizations/current/people-intakes/${id}`,
        {},
        true,
      );
      if (record.status !== 'draft') {
        throw new Error('Only draft intakes can be reopened for editing.');
      }
      setDraft(fromRecord(record));
      setReviewRecord(null);
      setReviewNotes('');
      setMessage({
        tone: 'success',
        text: `Draft loaded at version ${String(record.version)}.`,
      });
    } catch (error) {
      setMessage({ tone: 'error', text: messageFrom(error) });
    } finally {
      setBusy(false);
    }
  }

  async function openReview(id: string): Promise<void> {
""",
    "open draft operation",
)
text = replace_once(
    text,
    """          <select value={membershipId} onChange={(event) => setMembershipId(event.target.value)}>
""",
    """          <select
            value={membershipId}
            onChange={(event) => changeMembership(event.target.value)}
          >
""",
    "organization selection handler",
)
text = replace_once(
    text,
    "          Refresh queue\n",
    "          Refresh workspace\n",
    "refresh button label",
)
text = replace_once(
    text,
    """              onClick={() => {
                setDraft(initialFamilyIntakeDraft());
                setMessage({ tone: 'neutral', text: 'New unsaved draft started.' });
              }}
""",
    """              onClick={() => {
                setDraft(initialFamilyIntakeDraft());
                setReviewRecord(null);
                setReviewNotes('');
                setMessage({ tone: 'neutral', text: 'New unsaved draft started.' });
              }}
""",
    "new draft reset",
)
saved_panel = """          <section className={styles.panel}>
            <div className={styles.blockHeader}>
              <div>
                <p className={styles.eyebrow}>Saved drafts</p>
                <h2>{String(savedDrafts.length)} editable</h2>
              </div>
            </div>
            {savedDrafts.length === 0 ? (
              <p className={styles.empty}>No saved drafts in this organization.</p>
            ) : (
              <div className={styles.queueList}>
                {savedDrafts.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={styles.queueItem}
                    disabled={busy}
                    onClick={() => void openDraft(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>
                      {item.person_count} people · {item.relationship_count} relationships · version{' '}
                      {item.version}
                    </span>
                    <small>Updated {new Date(item.updated_at).toLocaleString()}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

"""
text = replace_once(
    text,
    """          <section className={styles.panel}>
            <div className={styles.blockHeader}>
              <div>
                <p className={styles.eyebrow}>Verification queue</p>
""",
    saved_panel
    + """          <section className={styles.panel}>
            <div className={styles.blockHeader}>
              <div>
                <p className={styles.eyebrow}>Verification queue</p>
""",
    "saved drafts panel",
)
path.write_text(text)
