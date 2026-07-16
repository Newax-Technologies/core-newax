from pathlib import Path
import runpy

builder = Path('tooling/temp-build-family-relationship-api.py')
source = builder.read_text()
old = '''    '  verificationSource  String?   @map("verification_source") @db.VarChar(128)\\n  sourceReference     String?   @map("source_reference") @db.VarChar(255)\\n  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)',
'''
new = '''    '  verificationSource String?   @map("verification_source") @db.VarChar(128)\\n  sourceReference    String?   @map("source_reference") @db.VarChar(255)\\n  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)',
'''
if source.count(old) != 1:
    raise SystemExit(f'family relationship builder schema anchor: expected one match, found {source.count(old)}')
source = source.replace(old, new, 1)
normalized = Path('/tmp/temp-build-family-relationship-api-normalized.py')
normalized.write_text(source)
runpy.run_path(str(normalized), run_name='__main__')
