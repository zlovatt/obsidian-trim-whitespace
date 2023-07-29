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
		// console.clear();
		const editor = this._getEditor();

		if (!editor) {
			return;
		}

		const input = editor.getValue();

		const fromCursor = editor.getCursor("from");
		const fromCursorOffset = editor.posToOffset(fromCursor);
		const fromCursorFenceIndices = getCursorFenceIndices(input, fromCursorOffset);

		const toCursor = editor.getCursor("to");
		const toCursorOffset = editor.posToOffset(toCursor);
		const toCursorFenceIndices = getCursorFenceIndices(input, toCursorOffset);

		// ZACK NOTE
		// for the 'between text' can we get the nearest fences and get everything between them?
		// const pre = input.slice(0, fromCursorOffset.start);
		// const current = input.slice(fromCursorOffset.start, toCursorOffset.end);
		// const post = input.slice(toCursorOffset.end);
		// console.log('pre:', pre.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
		// console.log('current:', current.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
		// console.log('post:', post.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
		// console.log("fromDelta | toDelta", fromDelta, toDelta);

		let trimmed = "";
		let fromNewOffset = 0;
		let toNewOffset = 0;

		// ztodo: do we need to have separate logic for auto-trim?
		// the intention is that this will skip current active block, vs other won't
		// but maybe the logic can be shared in some way?
		// if we do need it... move the 'get fence indices' logic here, vs shared context above
		if (causedBy == TrimTrigger.AutoTrim) {
			// When auto-trimming, do not modify whitespace immediately before
			// the cursor/selection, within the selection, or immediately
			// after the cursor/selection.
			const beforeText = input.slice(0, fromCursorFenceIndices.start);
			const betweenText = input.slice(fromCursorFenceIndices.start, toCursorFenceIndices.end);
			const afterText = input.slice(toCursorFenceIndices.end);

			console.log('-------');

			console.log('beforeText:', beforeText.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
			console.log('betweenText:', betweenText.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
			console.log('afterText:', afterText.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));

			console.log('-------');

			// // Separate the before text into text and trailing whitespace
			// const beforeText0 = beforeText.trimEnd();
			// const beforeText1 = beforeText.substr(beforeText0.length);
			// // Separate the after text into leading whitespace and text
			// const afterText1 = afterText.trimStart();
			// const afterText0 = afterText.substr(
			// 	0,
			// 	afterText.length - afterText1.length
			// );

			// console.log('beforeText0:', beforeText0.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
			// console.log('beforeText1:', beforeText1.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));

			// const beforeTrimmed2 = handleTextTrim(beforeText0, this.settings) + beforeText1;
			const beforeTrimmed = handleTextTrim(beforeText, this.settings);
			const afterTrimmed = handleTextTrim(afterText, this.settings);

			console.log('beforeTrimmed:', beforeTrimmed.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
			console.log('afterTrimmed:', afterTrimmed.replace(/ /gm, "•").replace(/\n|\r/gm, "↩"));
			console.log('-------');
			console.log('\n\n\n');

			/////// z: this 'get new offset' logic seems good
			fromNewOffset = fromCursorOffset - beforeText.length + beforeTrimmed.length;
			// const afterTextForOffset = input.slice(0, toCursorFenceIndices.end);
			// const afterTextForOffsetTrimmed = handleTextTrim(afterTextForOffset, this.settings);
			toNewOffset = toCursorOffset - beforeText.length + beforeTrimmed.length;
			/////// ^^^

			// this trimming logic is good too
			trimmed = beforeTrimmed + betweenText + afterTrimmed;

			/////// z: we may not need the below
			// const fullyTrimmed = handleTextTrim(input, this.settings);
			// if (trimmed != fullyTrimmed) {
			// 	this.debouncedTrim(); // keep the debouncer cycling till done
			// }
			/////// z: ^^
		} else {
			// Some fuckery to get start and end cursor positions when
			// trimming the whole document; Not ideal at all, but need to
			// figure out how much to shift head and tail independently
			const fromBeforeText = input.slice(0, fromCursorOffset);
			const fromBeforeTrimmed = handleTextTrim(
				fromBeforeText,
				this.settings
			);
			fromNewOffset = fromBeforeTrimmed.length;
			const toBeforeText = input.slice(0, toCursorOffset);
			const toBeforeTrimmed = handleTextTrim(toBeforeText, this.settings);
			toNewOffset = toBeforeTrimmed.length;

			trimmed = handleTextTrim(input, this.settings);
		}

		// Only process if text is different
		if (trimmed == input) {
			return;
		}

		editor.setValue(trimmed);
		editor.setSelection(
			editor.offsetToPos(fromNewOffset),
			editor.offsetToPos(toNewOffset)
		);

		function getCursorFenceIndices(input: string, cursorOffset: number) {
			const CODE_BLOCK_REG = /\s?```([\s\S]+?)```\s?/gm;
			const WHITESPACE_BLOCK_REG = /\s+/gm;

			const cursorRange = {start: cursorOffset, end: cursorOffset};

			const cursorCodeBlockIndices = getRegexBlockStartEndIndices(input, cursorOffset, CODE_BLOCK_REG);

			if (cursorCodeBlockIndices.isInFence) {
				cursorRange.start = cursorCodeBlockIndices.start;
				cursorRange.end = cursorCodeBlockIndices.end;
			} else {
				const cursorWhiteSpaceIndices = getRegexBlockStartEndIndices(input, cursorOffset, WHITESPACE_BLOCK_REG);

				if (cursorWhiteSpaceIndices.isInFence) {
					cursorRange.start = cursorWhiteSpaceIndices.start;
					cursorRange.end = cursorWhiteSpaceIndices.end;
				}
			}

			return cursorRange;
		}


		function getRegexBlockStartEndIndices(string: string, currentIndex: number, regex: RegExp) {
			const indices = {
				start: currentIndex,
				end: currentIndex,
				nearest: currentIndex,
				isInFence: false,
			};

			const matches = [];
			let match = regex.exec(string);

			while (match) {
				matches.push(match);
				match = regex.exec(string);
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
				currentIndex < firstMatch.index ||
				currentIndex > lastMatch.index + lastMatch[0].length
			) {
				return indices;
			}

			// Find the fence that contains the index
			const containingFence = matches.find((match) => {
				const rangeStart = match.index;
				const rangeEnd = rangeStart + match[0].length;

				return currentIndex > rangeStart && currentIndex < rangeEnd;
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
			indices.nearest = (Math.abs(indices.start - currentIndex) < Math.abs(indices.end - currentIndex) ? indices.start : indices.end);

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
