# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added

-

### Changed

-

### Fixed

- ***

## [v0.3.0] - 2023/07/30

### Added

- Jest test suite (thanks @velebit!)
- Setting to preserve leading characters if part of an indented list
- Setting to control whether `CTRL/CMD + S` trims document

### Changed

- Auto-Trim to skip currently-active text block ([\#5](https://github.com/zlovatt/obsidian-trim-whitespace/issues/5))
- Trimming via `CTRL/CMD + S` no longer requires Auto-Trim to be enabled ([\#12](https://github.com/zlovatt/obsidian-trim-whitespace/issues/12))
- "Skip Code Blocks" setting name to "Preserve Code Blocks"
- Improved detection of code blocks

### Fixed

- Trimming of indented lists ([\#9](https://github.com/zlovatt/obsidian-trim-whitespace/issues/9))
- Plugin not loading on iOS (thanks @velebit!) ([\#14](https://github.com/zlovatt/obsidian-trim-whitespace/issues/14))
- Typo in settings ([\#16](https://github.com/zlovatt/obsidian-trim-whitespace/issues/16))
- Issue trimming code blocks containing template literals ([\#17](https://github.com/zlovatt/obsidian-trim-whitespace/issues/17))

---

## [v0.2.2] - 2022/08/10

### Changed

- "Cmd/Ctrl+S" triggers auto-trim, if enabled ([\#6](https://github.com/zlovatt/obsidian-trim-whitespace/issues/6))

### Fixed

- "Skip code blocks" failing with multiple nearby code fences ([\#8](https://github.com/zlovatt/obsidian-trim-whitespace/issues/8))
- "Skip code blocks" misplacing selection cursors in documents containing code

---

## [v0.2.1] - 2022/07/24

### Fixed

- "Skip code blocks" failing if more than 10 code blocks present in document ([\#7](https://github.com/zlovatt/obsidian-trim-whitespace/issues/7))

---

## [v0.2.0] - 2022/07/13

### Added

- Setting to control minimum time delay between auto-trim ([\#1](https://github.com/zlovatt/obsidian-trim-whitespace/issues/1))
- Option to skip code blocks ([\#4](https://github.com/zlovatt/obsidian-trim-whitespace/issues/4))

### Changed

- Mechanism used for auto-trimming
- 'Multiple Characters' to only trim inline characters ([\#2](https://github.com/zlovatt/obsidian-trim-whitespace/issues/2))

### Fixed

- 'Multiple Characters' trimming within tables ([\#3](https://github.com/zlovatt/obsidian-trim-whitespace/issues/3))

---

## [v0.1.0] - 2022/06/27

### Added

- Initial commit!

[Unreleased]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/main...develop
[v0.3.0]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/v0.2.2...v0.3.0
[v0.2.2]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/v0.2.1...v0.2.2
[v0.2.1]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/zlovatt/obsidian-trim-whitespace/compare/a53bdb3...v0.1.0
