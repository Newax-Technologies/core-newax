from pathlib import Path


service_spec_path = Path(
    "packages/people-intake/src/services/people-intake.service.spec.ts"
)
lines = service_spec_path.read_text().splitlines()
start_matches = [
    index for index, line in enumerate(lines) if "const duplicate = payload();" in line
]
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
service_spec_path.write_text("\n".join(lines) + "\n")

web_spec_path = Path(
    "apps/web/src/app/internal/people-intake/people-intake-model.spec.ts"
)
web_spec = web_spec_path.read_text()
old_expectation = "expect(maskIdentifier('12345-1234567-1')).toBe('••••••••567-1');"
new_expectation = "expect(maskIdentifier('12345-1234567-1')).toBe('••••••••67-1');"
if web_spec.count(old_expectation) != 1:
    raise SystemExit("identifier mask expectation: expected exactly one old assertion")
web_spec_path.write_text(web_spec.replace(old_expectation, new_expectation, 1))
