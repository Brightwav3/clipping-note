# Clipping Note

> Obsidian plugin, který jedním kliknutím vytvoří novou **Clipping poznámku** podle šablony — chová se stejně jako jádrové pluginy *Daily Note* a *Unique Note*.

Klikni na ikonku nůžek v postranním panelu (nebo spusť příkaz) a plugin založí nový soubor `.md` ve složce `Clippings`, pojmenovaný podle data a času, s obsahem z tvojí šablony.

![Version](https://img.shields.io/badge/version-1.0.0-d39a67)
![Obsidian](https://img.shields.io/badge/Obsidian-0.15.3%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Funkce

- **Jedním kliknutím** — ikonka nůžek (`scissors`) v postranním panelu vytvoří a rovnou otevře novou poznámku.
- **Příkaz do palety** — *„Vytvořit Clipping poznámku“* (Ctrl/Cmd + P), lze přiřadit klávesovou zkratku.
- **Pojmenování podle data/času** — výchozí formát `Clipping D. M. Y HH-mm` (např. `Clipping 10. 6. 2026 21-04`). Dvojtečka v čase je nahrazena pomlčkou, aby byl název platný.
- **Šablony** — obsah se naplní ze zadané šablony se zpracováním zástupných výrazů.
- **Bez kolizí** — pokud soubor se stejným názvem existuje, přidá se ` 1`, ` 2`, …
- **Automatické vytvoření složky** — cílová složka se založí, pokud ještě neexistuje.

## Zástupné výrazy v šabloně

Stejně jako u jádrových pluginů Obsidianu:

| Výraz | Nahradí se za |
| --- | --- |
| `{{title}}` | název poznámky (prefix + datum/čas) |
| `{{date}}` | datum ve formátu `YYYY-MM-DD` |
| `{{date:FORMAT}}` | datum ve vlastním [moment.js](https://momentjs.com/docs/#/displaying/format/) formátu |
| `{{time}}` | čas ve formátu `HH:mm` |
| `{{time:FORMAT}}` | čas ve vlastním moment.js formátu |

## Nastavení

V **Nastavení → Clipping Note**:

| Volba | Výchozí | Popis |
| --- | --- | --- |
| Cílová složka | `Clippings` | Kam se ukládají nové poznámky. |
| Šablona | `-Template/Clipping Template` | Cesta k souboru šablony (bez `.md`). |
| Formát názvu | `D. M. Y HH-mm` | moment.js formát za prefixem. |
| Prefix názvu | `Clipping ` | Text před datem v názvu souboru. |

## Instalace

### Ručně

1. Stáhni `main.js` a `manifest.json` z tohoto repozitáře.
2. Zkopíruj je do svého vaultu do `.obsidian/plugins/clipping-note/`.
3. Restartuj Obsidian a zapni **Clipping Note** v **Nastavení → Komunitní pluginy**.

## Kompatibilita

- Vyžaduje Obsidian **0.15.3** nebo novější.
- Funguje na **desktopu i mobilu** (`isDesktopOnly: false`).

## Licence

[MIT](LICENSE) © 2026 Šimon Zelenka
