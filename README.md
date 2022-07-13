# Trim Whitespace

<!-- Aspriational stuff below ⬇ -->
<!-- [![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?color=7e6ad6&labelColor=34208c&label=Obsidian%20Downloads&query=$['obsidian-trim-whitespace'].downloads&url=https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json&)](obsidian://show-plugin?id=obsidian-trim-whitespace) ![GitHub stars](https://img.shields.io/github/stars/zlovatt/obsidian-trim-whitespace?style=flat) -->

Trims unnecessary whitespace from your Obsidian documents.

---

## Features

Trim Whitespace operates on three different types of whitespace, with three different targets.

### Whitespace Types

1. **Spaces** - The space character, (` `, stylised as `·`)
2. **Tabs** - The tab character, (`\t` or `	`, stylised as `→`)
3. **Lines** - Newline character, either, (`\r` or `\n`, stylised as `¬`)

### Targets

#### Trailing

Trim whitespace at the **end** of each line, or open document.

|                      Before                       |                After                |
| ------------------------------------------------- | ----------------------------------- |
| <pre>Hello·World!····</pre>                       | <pre>Hello·World!</pre>             |
| <pre>Hello·World!→→→</pre>                        | <pre>Hello·World!</pre>             |
| <pre># Hello¬<br>¬<br>World!¬<br>¬<br>¬<br></pre> | <pre># Hello¬<br>¬<br>World!¬</pre> |

#### Leading

Trim whitespace at the **start** of each line, or open document.

  |                    Before                     |                After                |
  | --------------------------------------------- | ----------------------------------- |
  | <pre>····Hello·World!</pre>                   | <pre>Hello·World!</pre>             |
  | <pre>→→→Hello·World!</pre>                    | <pre>Hello·World!</pre>             |
  | <pre>¬<br>¬<br># Hello¬<br>¬<br>World!¬</pre> | <pre># Hello¬<br>¬<br>World!¬</pre> |

#### Multiple

Trim groups of whitespace (2 or more consecutive **inline** spaces/tabs, or **consecutive lines**)

|                       Before                       |                After                |
| -------------------------------------------------- | ----------------------------------- |
| <pre>Hello···World!</pre>                          | <pre>Hello·World!</pre>             |
| <pre>Hello→→→World!</pre>                          | <pre>Hello→World!</pre>             |
| <pre># Hello¬<br>¬<br>¬<br>World!¬<br>¬<br>¬</pre> | <pre># Hello¬<br>¬<br>World!¬</pre> |

---

## Commands

* **Trim whitespace in document** trims all whitespace in the active document, according to the settings below
* **Trim whitespace in selection** trims all whitespace in the selected region in the active document, according to the settings below

Trim Whitespace also adds a ribbon button to trim document whitespace, though you can **hold shift** to trim whitespace in selection instead.

---

## Settings

|       Feature        |                                   Description                                   |
| -------------------- | ------------------------------------------------------------------------------- |
| Auto-Trim            | **Automatically trim document** when modified, according to the settings below. |
| Auto-Trim Delay      | Time to wait **in seconds** before auto-trimming.                               |
| Skip Code Blocks     | Whether to ignore code blocks when trimming.                                    |
| Trim Trailing Spaces | Trim **spaces** at the **end of each line**.                                    |
| Trim Trailing Tabs   | Trim **tabs** at the **end of each line**.                                      |
| Trim Trailing Lines  | Trim **empty** lines at the **end of the document**.                            |
| Trim Leading Spaces  | Trim **spaces** at the **start of each line**.                                  |
| Trim Leading Tabs    | Trim **tabs** at the **start of each line**.                                    |
| Trim Leading Lines   | Trim **lines** at the **start of the document**.                                |
| Trim Multiple Spaces | Trim **groups** of **multiple inline spaces**.                                  |
| Trim Multiple Tabs   | Trim **groups** of **multiple inline tabs**.                                    |
| Trim Multiple Lines  | Trim **groups** of **multiple blank lines**.                                    |

---

## Installation

To install, either:

1. Install manually with the zip in [Releases](http://github.com/zlovatt/obsidian-trim-whitespace/releases), or (hopefully eventually)
2. ~~Download from the [Obsidian Community Plugin library](obsidian://show-plugin?id=obsidian-trim-whitespace)~~


---

### Known Bugs

- Trimming the whole document doesn't reset cursor position properly, if the original location started before the first non-space character in the document.

---

### Credit Due

Inspired by [@Benature](https://github.com/Benature)'s [obsidian-text-format](https://github.com/Benature/obsidian-text-format).
