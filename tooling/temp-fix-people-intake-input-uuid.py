from pathlib import Path


def replace_exact(text: str, old: str, new: str, expected: int, label: str) -> str:
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)


service_path = Path("packages/people-intake/src/services/people-intake.service.ts")
service = service_path.read_text()
service = replace_exact(
    service,
    "this.uuid(intakeId, 'intakeId')",
    "this.inputUuid(intakeId, 'intakeId')",
    4,
    "intake identifier validation",
)
service = replace_exact(
    service,
    "this.uuid(query.afterId, 'afterId')",
    "this.inputUuid(query.afterId, 'afterId')",
    1,
    "cursor identifier validation",
)
method_anchor = "  private uuid(value: string, field: string): string {"
if service.count(method_anchor) != 1:
    raise SystemExit("UUID helper insertion: expected one trusted UUID helper")
input_helper = """  private inputUuid(value: string, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      this.invalid(field, `${field} must be a UUID.`);
    }
    return value.toLowerCase();
  }

"""
service = service.replace(method_anchor, input_helper + method_anchor, 1)
service_path.write_text(service)

spec_path = Path("packages/people-intake/src/services/people-intake.service.spec.ts")
spec = spec_path.read_text()
closing_anchor = "  });\n});\n"
if spec.count(closing_anchor) != 1:
    raise SystemExit("invalid intake ID regression test: expected one suite closing anchor")
regression_test = """

    it('classifies malformed client intake identifiers as invalid input', async () => {
      const service = new PeopleIntakeService(repository());
      await expect(
        service.get(context(PEOPLE_INTAKE_PERMISSIONS.view), 'not-a-uuid'),
      ).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_INVALID_INPUT' });
    });
"""
spec = spec.replace(closing_anchor, regression_test + "\n" + closing_anchor, 1)
spec_path.write_text(spec)
