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
    "import { useCallback, useEffect, useMemo, useState } from 'react';\n",
    "import Link from 'next/link';\nimport { useCallback, useEffect, useMemo, useState } from 'react';\n",
    "Next Link import",
)

lines = text.splitlines()
load_memberships_matches = [
    index for index, line in enumerate(lines) if "const loadMemberships = useCallback" in line
]
load_intakes_matches = [
    index for index, line in enumerate(lines) if "const loadIntakes = useCallback" in line
]
if len(load_memberships_matches) != 1 or len(load_intakes_matches) != 1:
    raise SystemExit("Expected one membership loader and one intake loader")
load_memberships_start = load_memberships_matches[0]
load_intakes_start = load_intakes_matches[0]
if load_memberships_start >= load_intakes_start:
    raise SystemExit("Membership loader must precede intake loader")
del lines[load_memberships_start:load_intakes_start]
text = "\n".join(lines) + "\n"

old_effects = """  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    void loadIntakes();
  }, [loadIntakes]);
"""
new_effects = """  useEffect(() => {
    const controller = new AbortController();
    void request<readonly Membership[]>('/api/account/memberships', {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setMemberships(response);
          setMembershipId((current) => current || response[0]?.membership_id || '');
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        }
      });
    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    if (membershipId.length === 0) {
      return undefined;
    }
    const controller = new AbortController();
    void request<{ readonly items: readonly IntakeSummary[] }>(
      '/api/core/organizations/current/people-intakes?limit=100',
      { signal: controller.signal },
      true,
    )
      .then((response) => {
        if (!controller.signal.aborted) {
          setIntakes(response.items);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        }
      });
    return () => controller.abort();
  }, [membershipId, request]);
"""
text = replace_once(text, old_effects, new_effects, "dashboard loading effects")
text = replace_once(
    text,
    """          <a className={styles.brand} href="/">
            NEWAX
          </a>
""",
    """          <Link className={styles.brand} href="/">
            NEWAX
          </Link>
""",
    "dashboard home link",
)
path.write_text(text)
