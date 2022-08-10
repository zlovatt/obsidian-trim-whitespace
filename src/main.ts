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
	AutoTrimDocument: true,
	AutoTrimTimeout: 2.5,

	SkipCodeBlocks: true,

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
					this.trimDocument();
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
			editorCallback: () => this.trimDocument(),
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
				if (this.settings.AutoTrimDocument) {
					this.trimDocument();
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
			this.trimDocument,
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
	trimDocument(): void {
		const editor = this._getEditor();

		if (!editor) {
			return;
		}

		const input = editor.getValue();

		// Some fuckery to get start and end cursor positions when trimming the whole document;
		// Not ideal at all, but need to figure out how much to shift head and tail independently
		const fromCursor = editor.getCursor("from");
		const fromCursorOffset = editor.posToOffset(fromCursor);
		const fromBeforeText = input.slice(0, fromCursorOffset);
		const fromBeforeTrimmed = handleTextTrim(fromBeforeText, this.settings);
		const fromLengthDelta = fromBeforeText.length - fromBeforeTrimmed.length;
		const fromNewOffset = fromCursorOffset - fromLengthDelta;

		const toCursor = editor.getCursor("to");
		const toCursorOffset = editor.posToOffset(toCursor);
		const toBeforeText = input.slice(0, toCursorOffset);
		const toBeforeTrimmed = handleTextTrim(toBeforeText, this.settings);
		const toLengthDelta = toBeforeText.length - toBeforeTrimmed.length;
		const toNewOffset = toCursorOffset - toLengthDelta;

		const trimmed = handleTextTrim(input, this.settings);

		// Only process if text is different
		if (trimmed == input) {
			return;
		}

		editor.setValue(trimmed);
		editor.setSelection(
			editor.offsetToPos(fromNewOffset),
			editor.offsetToPos(toNewOffset)
		);
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
