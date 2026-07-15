from pathlib import Path


path = Path("packages/people-intake/src/services/people-intake.service.spec.ts")
lines = path.read_text().splitlines()
start_matches = [index for index, line in enumerate(lines) if "const duplicate = payload();" in line]
if len(start_matches) != 1:
    raise SystemExit(
        f"duplicate identifier fixture: expected one start anchor, found {len(start_matches)}"
    )
start = start_matches[0]
end_matches = [
    index
    for index in range(start + 1, len(lines))
    if "await expect(" in lines[index]
]
if len(end_matches) == 0:
    raise SystemExit("duplicate identifier fixture: end anchor was not found")
end = end_matches[0]
indent = lines[start][: len(lines[start]) - len(lines[start].lstrip())]
replacement = [
    f"{indent}const base = payload();",
    f"{indent}const parent = base.people[0];",
    f"{indent}const child = base.people[1];",
    f"{indent}if (parent === undefined || child === undefined) {{",
    f"{indent}  throw new Error('The duplicate-identifier fixture requires two people.');",
    f"{indent}}}",
    f"{indent}const duplicate = {{",
    f"{indent}  ...base,",
    f"{indent}  people: [",
    f"{indent}    parent,",
    f"{indent}    {{",
    f"{indent}      ...child,",
    f"{indent}      identifiers: [",
    f"{indent}        {{",
    f"{indent}          identifierType: 'cnic',",
    f"{indent}          identifierValue: '1234512345671',",
    f"{indent}          issuingCountryCode: 'PK',",
    f"{indent}          issuingAuthority: 'NADRA',",
    f"{indent}        }},",
    f"{indent}      ],",
    f"{indent}    }},",
    f"{indent}  ],",
    f"{indent}}};",
]
lines[start:end] = replacement
path.write_text("\n".join(lines) + "\n")
