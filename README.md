# Clipping Note

> An [Obsidian](https://obsidian.md) plugin that creates a new **Clipping note** from a template with a single click — it behaves just like the core *Daily Note* and *Unique Note* plugins.

Click the scissors icon in the sidebar ribbon (or run the command) and the plugin creates a new `.md` file in your `Clippings` folder, named by date and time, with its body filled from your template.

![Version](https://img.shields.io/badge/version-1.0.0-d39a67)
![Obsidian](https://img.shields.io/badge/Obsidian-0.15.3%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **One click** — the scissors (`scissors`) ribbon icon creates and immediately opens a new note.
- **Command palette** — *“Create Clipping note”* (Ctrl/Cmd + P); assign a hotkey if you like.
- **Date/time filename** — default format `Clipping D. M. Y HH-mm` (e.g. `Clipping 10. 6. 2026 21-04`). The colon in the time is replaced with a hyphen so the filename stays valid.
- **Templates** — the body is filled from a template file, with placeholder substitution.
- **No collisions** — if a file with the same name exists, ` 1`, ` 2`, … is appended.
- **Auto-creates the folder** — the target folder is created if it doesn't exist yet.
- **English & Czech** — the interface is English by default, with a Czech localization toggle in the settings.

## Template placeholders

Same as Obsidian's core plugins:

| Placeholder | Replaced with |
| --- | --- |
| `{{title}}` | the note name (prefix + date/time) |
| `{{date}}` | date formatted as `YYYY-MM-DD` |
| `{{date:FORMAT}}` | date in a custom [moment.js](https://momentjs.com/docs/#/displaying/format/) format |
| `{{time}}` | time formatted as `HH:mm` |
| `{{time:FORMAT}}` | time in a custom moment.js format |

## Settings

In **Settings → Clipping Note**:

| Option | Default | Description |
| --- | --- | --- |
| Target folder | `Clippings` | Where new notes are saved. |
| Template | `-Template/Clipping Template` | Path to the template file (without `.md`). |
| Filename format | `D. M. Y HH-mm` | moment.js format used after the prefix. |
| Filename prefix | `Clipping ` | Text before the date in the filename. |
| Czech localization | off | Switch the interface to Czech. Ribbon and command labels update after reloading Obsidian. |

## Installation

### Manual

1. Download `main.js` and `manifest.json` from this repository.
2. Copy them into your vault at `.obsidian/plugins/clipping-note/`.
3. Reload Obsidian, then enable **Clipping Note** under **Settings → Community plugins**.

## Compatibility

- Requires Obsidian **0.15.3** or newer.
- Works on **desktop and mobile** (`isDesktopOnly: false`).

## License

[MIT](LICENSE) © 2026 Šimon Zelenka
