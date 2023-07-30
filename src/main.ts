import {
	debounce,
	Debouncer,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
} from "obsidian";

import { TrimWhitespaceSettingTab } from "./settings";
import handleTextTrim from "./utils/trimText";

const DEFAULT_SETTINGS: TrimWhitespaceSettings = {
	TrimOnSave: true,

	AutoTrimDocument: true,
	AutoTrimTimeout: 2.5,

	PreserveCodeBlocks: true,
	PreserveIndentedLists: true,

	TrimTrailingSpaces: true,
	TrimLeadingSpaces: false,
	TrimMultipleSpaces: false,

	TrimTrailingTabs: true,
	TrimLeadingTabs: false,
	TrimMultipleTabs: false,

	TrimTrailingLines: true,
	TrimLeadingLines: false,
	TrimMultipleLines: false,
};

enum TrimTrigger {
	Command,
	Save,
	AutoTrim,
}

export default class TrimWhitespace extends Plugin {
	settings: TrimWhitespaceSettings;
	debouncedTrim: Debouncer<[]>;

	async onload() {
		await this.loadSettings();

		// Register event to trim on save, based on option
		this._initializeDebouncer(this.settings.AutoTrimTimeout);
		this._toggleListenerEvent(this.settings.AutoTrimDocument);

		// Left ribbon button
		this.addRibbonIcon(
			"unindent-glyph",
			"Trim whitespace",
			(evt: MouseEvent) => {
				if (evt.shiftKey) {
					this.trimSelection();
				} else {
					this.trimDocument(TrimTrigger.Command);
				}
			}
		);

		this.addCommand({
			id: "trim-whitespace-selection",
			name: "Remove whitespace in selection",
			editorCallback: () => this.trimSelection(),
		});

		this.addCommand({
			id: "trim-whitespace-document",
			name: "Remove whitespace in document",
			editorCallback: () => this.trimDocument(TrimTrigger.Command),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TrimWhitespaceSettingTab(this.app, this));

		// Highjack ctrl+s
		// eslint-disable-next-line
		const saveCommandDefinition = (this.app as any).commands?.commands?.[
			"editor:save-file"
		];
		const save = saveCommandDefinition?.callback;

		if (typeof save === "function") {
			saveCommandDefinition.callback = () => {
				if (this.settings.TrimOnSave) {
					this.trimDocument(TrimTrigger.Save);
				}

				save();
			};
		}
	}

	/**
	 * Gets the active editor, if present
	 *
	 * @return Active editor, or null
	 */
	_getEditor(): Editor | null {
		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!markdownView) {
			return null;
		}

		return markdownView.editor;
	}

	/**
	 * Initializes the auto-trim debouncer, with a given timeout frequency
	 *
	 * @param delaySeconds Timeout value debounce with
	 */
	_initializeDebouncer(delaySeconds: number): void {
		this.debouncedTrim = debounce(
			() => this.trimDocument(TrimTrigger.AutoTrim),
			delaySeconds * 1000,
			true
		);
	}

	/**
	 * Enables or disables the listener
	 *
	 * @param toggle Whether to enabled or disable the listener
	 */
	_toggleListenerEvent(toggle: boolean): void {
		if (!this.debouncedTrim) {
			new Notice("Trim Whitespace: Can't start auto trimmer!");
			return;
		}

		if (toggle) {
			this.registerEvent(
				this.app.workspace.on("editor-change", this.debouncedTrim, this)
			);
		} else {
			this.app.workspace.off("editor-change", this.debouncedTrim);
		}
	}

	/**
	 * Trims whitespace in selected text
	 */
	trimSelection(): void {
		const editor = this._getEditor();

		if (!editor) {
			return;
		}

		const input = editor.getSelection();

		// Make sure something is selected
		if (input.length == 0) {
			new Notice("Select text to trim!");
			return;
		}

		const trimmed = handleTextTrim(input, this.settings);

		// Only process if text is different
		if (trimmed == input) {
			return;
		}

		editor.replaceSelection(trimmed);

		const toCursor = editor.posToOffset(editor.getCursor("to"));
		const toDelta = trimmed.length;
		const newFrom = toCursor - toDelta;

		editor.setSelection(
			editor.offsetToPos(newFrom),
			editor.offsetToPos(toCursor)
		);
	}

	/**
	 * Trims whitespace in document
	 */
	trimDocument(causedBy: TrimTrigger): void {
		const editor = this._getEditor();

		if (!editor) {
			return;
		}

		const input = editor.getValue();

		// Get 'from' cursor, snapping to nearest code fence or whitespace block
		const fromCursor = editor.getCursor("from");
		const fromCursorOffset = editor.posToOffset(fromCursor);
		const fromCursorFenceIndices = getCursorFenceIndices(input, fromCursorOffset);

		// Get 'to' cursor, snapping to nearest code fence or whitespace block
		const toCursor = editor.getCursor("to");
		const toCursorOffset = editor.posToOffset(toCursor);
		const toCursorFenceIndices = getCursorFenceIndices(input, toCursorOffset);

		// Get and trim the text before the cursor
		const textBeforeCursor = input.slice(0, fromCursorFenceIndices.start);
		const textBeforeCursorTrimmed = handleTextTrim(textBeforeCursor, this.settings);

		// Get the active text, where the cursor is
		const textAtCursor = input.slice(fromCursorFenceIndices.start, toCursorFenceIndices.end);

		// Get and trim the text after the cursor
		const textAfterCursor = input.slice(toCursorFenceIndices.end);
		const textAfterCursorTrimmed = handleTextTrim(textAfterCursor, this.settings);

		// Concatenate the trimmed and current text blocks
		const trimmed = textBeforeCursorTrimmed + textAtCursor + textAfterCursorTrimmed;

		// Only process if text is different
		if (trimmed == input) {
			return;
		}

		// Calculate new selection offsets
		const newFromCursorOffset = fromCursorOffset - textBeforeCursor.length + textBeforeCursorTrimmed.length;
		const newToCursorOffset = toCursorOffset - textBeforeCursor.length + textBeforeCursorTrimmed.length;

		editor.setValue(trimmed);
		editor.setSelection(
			editor.offsetToPos(newFromCursorOffset),
			editor.offsetToPos(newToCursorOffset)
		);

		/**
		 * Gets start and end ranges of a code fence or whitespace block
		 * that the cursor offset position is within
		 *
		 * @param str          String to get start/end fences in
		 * @param cursorOffset Cursor position to get fence locations from
		 * @return             Start/end block indices
		 */
		function getCursorFenceIndices(str: string, cursorOffset: number) {
			const CODE_BLOCK_REG = /(?:\s?)```([\s\S]+?)```(?:\s?)/gm;
			const WHITESPACE_BLOCK_REG = /\s+/gm;

			const cursorRange = {start: cursorOffset, end: cursorOffset};
			const cursorCodeBlockIndices = getStringBlockStartEndIndices(str, cursorOffset, CODE_BLOCK_REG);

			if (cursorCodeBlockIndices.isInFence) {
				// Offset by 1 to account for the wrapping newlines around valid code fences
				cursorRange.start = cursorCodeBlockIndices.start - 1;
				cursorRange.end = cursorCodeBlockIndices.end + 1;
			} else {
				const cursorWhiteSpaceIndices = getStringBlockStartEndIndices(str, cursorOffset, WHITESPACE_BLOCK_REG);

				if (cursorWhiteSpaceIndices.isInFence) {
					cursorRange.start = cursorWhiteSpaceIndices.start;
					cursorRange.end = cursorWhiteSpaceIndices.end;
				}
			}

			return cursorRange;
		}

		/**
		 * Checks whether the character in the string at a given position
		 * falls into a block of text detected by a given regex.
		 *
		 * Returns an object with the start/end indices of that block as well as
		 * info on whether the character is in a block at all/
		 *
		 * @todo We can infer isInFence if we initialize start/end to -1
		 * @todo strip 'nearest'
		 *
		 * @param str      String to search within
		 * @param position Character position to start search from
		 * @param regex    RegExp to use to detect block
		 * @return         Indices data
		 */
		function getStringBlockStartEndIndices(str: string, position: number, regex: RegExp) {
			const indices = {
				start: position,
				end: position,
				nearest: position,
				isInFence: false,
			};

			const matches = [];
			let match = regex.exec(str);

			while (match) {
				matches.push(match);
				match = regex.exec(str);
			}

			// If there are no code fences, just get the index
			if (matches.length === 0) {
				return indices;
			}

			const firstMatch = matches[0];
			const lastMatch = matches[matches.length - 1];

			// If the current index is before the first match's index, or after the last match, we're already good
			// ztodo: This may not be necessary.....
			if (
				position < firstMatch.index ||
				position > lastMatch.index + lastMatch[0].length
			) {
				return indices;
			}

			// Find the fence that contains the index
			const containingFence = matches.find((match) => {
				const rangeStart = match.index;
				const rangeEnd = rangeStart + match[0].length;

				return position >= rangeStart && position <= rangeEnd;
			});

			// ztodo: can we remove this?
			// If we're between fences but not actually in one, get out
			if (!containingFence) {
				return indices;
			}

			// Finally, we must be in a fence
			indices.isInFence = true;
			indices.start = containingFence.index;
			indices.end = indices.start + containingFence[0].length;

			// Between the start and end, get the value that's nearest to the current index
			// ztodo: do we need nearest?
			indices.nearest = (Math.abs(indices.start - position) < Math.abs(indices.end - position) ? indices.start : indices.end);

			return indices;
		}
	}

	/**
	 * Loads settings from disk
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	/**
	 * Saves settings to disk
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
