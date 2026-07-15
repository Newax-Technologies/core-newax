from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


path = Path(
    "apps/web/src/app/internal/people-intake/people-intake-dashboard.module.css"
)
text = path.read_text()
replacements = [
    ("\nlabel {", "\n.shell label {", "label selector"),
    (
        "\ninput,\nselect,\ntextarea {",
        "\n.shell input,\n.shell select,\n.shell textarea {",
        "form control selector",
    ),
    ("\ntextarea {", "\n.shell textarea {", "textarea selector"),
    (
        "\ninput:focus,\nselect:focus,\ntextarea:focus {",
        "\n.shell input:focus,\n.shell select:focus,\n.shell textarea:focus {",
        "focus selector",
    ),
    (
        "\ninput:disabled,\nselect:disabled,\ntextarea:disabled {",
        "\n.shell input:disabled,\n.shell select:disabled,\n.shell textarea:disabled {",
        "disabled selector",
    ),
    ("\nbutton {", "\n.shell button {", "button selector"),
    (
        "\nbutton:hover:not(:disabled) {",
        "\n.shell button:hover:not(:disabled) {",
        "button hover selector",
    ),
    ("\nbutton:disabled {", "\n.shell button:disabled {", "button disabled selector"),
    ("\ncode {", "\n.shell code {", "code selector"),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
path.write_text(text)
