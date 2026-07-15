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
anchor = """  private uuid(value: string, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new PeopleIntakeModuleError(
        'PEOPLE_INTAKE_INTEGRITY_FAILURE',
        `${field} must be a UUID.`,
        { field },
      );
    }
    return value.toLowerCase();
  }
"""
replacement = """  private inputUuid(value: string, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      this.invalid(field, `${field} must be a UUID.`);
    }
    return value.toLowerCase();
  }

  private uuid(value: string, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new PeopleIntakeModuleError(
        'PEOPLE_INTAKE_INTEGRITY_FAILURE',
        `${field} must be a UUID.`,
        { field },
      );
    }
    return value.toLowerCase();
  }
"""
service = replace_exact(service, anchor, replacement, 1, "UUID helper insertion")
service_path.write_text(service)

spec_path = Path("packages/people-intake/src/services/people-intake.service.spec.ts")
spec = spec_path.read_text()
anchor_test = """    it('requires an explicit create permission', async () => {
      const service = new PeopleIntakeService(repository());
      await expect(
        service.createDraft(context(), {
          title: 'Forbidden',
          sourceType: 'manual',
          payload: payload(),
        }),
      ).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_FORBIDDEN' });
    });
"""
replacement_test = anchor_test + """

    it('classifies malformed client intake identifiers as invalid input', async () => {
      const service = new PeopleIntakeService(repository());
      await expect(
        service.get(context(PEOPLE_INTAKE_PERMISSIONS.view), 'not-a-uuid'),
      ).rejects.toMatchObject({ code: 'PEOPLE_INTAKE_INVALID_INPUT' });
    });
"""
spec = replace_exact(spec, anchor_test, replacement_test, 1, "invalid intake ID regression test")
spec_path.write_text(spec)
