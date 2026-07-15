from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


path = Path("packages/people-intake/src/services/people-intake.service.spec.ts")
text = path.read_text()
text = replace_once(
    text,
    """        const duplicate = payload();
        duplicate.people[1] = {
          ...duplicate.people[1],
          identifiers: [
            {
              identifierType: 'cnic',
              identifierValue: '1234512345671',
              issuingCountryCode: 'PK',
              issuingAuthority: 'NADRA',
            },
          ],
        };
""",
    """        const base = payload();
        const parent = base.people[0];
        const child = base.people[1];
        if (parent === undefined || child === undefined) {
          throw new Error('The duplicate-identifier fixture requires two people.');
        }
        const duplicate = {
          ...base,
          people: [
            parent,
            {
              ...child,
              identifiers: [
                {
                  identifierType: 'cnic',
                  identifierValue: '1234512345671',
                  issuingCountryCode: 'PK',
                  issuingAuthority: 'NADRA',
                },
              ],
            },
          ],
        };
""",
    "duplicate identifier fixture",
)
path.write_text(text)
