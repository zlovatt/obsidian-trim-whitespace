import {
	App,
	debounce,
	Debouncer,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import {
	buildTokenReplaceMap,
	replaceSwappedTokens,
} from "./utils/searchReplaceTokens";

import trimText from "./utils/trimText";

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
	CODE_SWAP_PREFIX = "TRIM_WHITESPACE_REPLACE_";
	CODE_SWAP_REGEX = [
		new RegExp(/```([\s\S]+?)```/gm), // markdown code fences
		new RegExp(/`([\s\S]+?)`/gm), // markdown code inline
	];

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
			callback: () => this.trimSelection(),
		});

		this.addCommand({
			id: "trim-whitespace-document",
			name: "Remove whitespace in document",
			callback: () => this.trimDocument(),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TrimWhitespaceSettingTab(this.app, this));
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
	 * Trims text, skipping code blocks if applicable
	 *
	 * @param  text Text to trim
	 * @return      Trimmed text
	 */
	_handleTextTrim(text: string): string {
		let terms: string[] = [];
		const skipCodeBlocks = this.settings.SkipCodeBlocks;

		if (skipCodeBlocks) {
			const swapData = buildTokenReplaceMap(
				text,
				this.CODE_SWAP_PREFIX,
				this.CODE_SWAP_REGEX
			);
			text = swapData.text;
			terms = swapData.terms;
		}

		let trimmed = trimText(text, this.settings);

		if (skipCodeBlocks) {
			trimmed = replaceSwappedTokens(text, this.CODE_SWAP_PREFIX, terms);
		}

		return trimmed;
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

		const trimmed = this._handleTextTrim(input);

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
		const fromCursor = editor.posToOffset(editor.getCursor("from"));
		const txtPreFrom = input.slice(0, fromCursor);
		const textPreFromTrimmed = trimText(txtPreFrom, this.settings);
		const fromDelta = txtPreFrom.length - textPreFromTrimmed.length;
		const newFrom = fromCursor - fromDelta;

		const toCursor = editor.posToOffset(editor.getCursor("to"));
		const txtPreTo = input.slice(0, toCursor);
		const txtPreToTrimmed = trimText(txtPreTo, this.settings);
		const toDelta = txtPreTo.length - txtPreToTrimmed.length;
		const newTo = toCursor - toDelta;

		const trimmed = this._handleTextTrim(input);

		// Only process if text is different
		if (trimmed == input) {
			return;
		}

		editor.setValue(trimmed);
		editor.setSelection(
			editor.offsetToPos(newFrom),
			editor.offsetToPos(newTo)
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

class TrimWhitespaceSettingTab extends PluginSettingTab {
	plugin: TrimWhitespace;

	constructor(app: App, plugin: TrimWhitespace) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "General Settings",
		});

		new Setting(containerEl)
			.setName("Auto-Trim")
			.setDesc(
				"Automatically trim document when modified, according to the settings below."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.AutoTrimDocument)
					.onChange(async (value) => {
						this.plugin.settings.AutoTrimDocument = value;
						await this.plugin.saveSettings();

						this.plugin._toggleListenerEvent(value);
					});
			});

		new Setting(containerEl)
			.setName("Auto-Trim Delay (seconds)")
			.setDesc("Seconds to wait before auto-trimming.")
			.addText((value) => {
				value
					.setValue(this.plugin.settings.AutoTrimTimeout.toString())
					.onChange(async (value) => {
						const textAsNumber = parseFloat(value);

						if (isNaN(textAsNumber)) {
							new Notice(
								"Trim Whitespace: Enter a valid number!"
							);
							return;
						}

						this.plugin.settings.AutoTrimTimeout = textAsNumber;
						await this.plugin.saveSettings();

						this.plugin._toggleListenerEvent(false);
						this.plugin._initializeDebouncer(textAsNumber);
						this.plugin._toggleListenerEvent(true);
					});
			});

		new Setting(containerEl)
			.setName("Skip Code Blocks")
			.setDesc("Whether to ignore code blocks when trimming whitespace.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.SkipCodeBlocks)
					.onChange(async (value) => {
						this.plugin.settings.SkipCodeBlocks = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", {
			text: "Trailing Characters",
		});

		new Setting(containerEl)
			.setName("Trim Trailing Spaces")
			.setDesc("Trim spaces at the end of each line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimTrailingSpaces)
					.onChange(async (value) => {
						this.plugin.settings.TrimTrailingSpaces = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Trailing Tabs")
			.setDesc("Trim tabs at the end of each line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimTrailingTabs)
					.onChange(async (value) => {
						this.plugin.settings.TrimTrailingTabs = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Trailing Lines")
			.setDesc("Trim empty lines at the end of the document.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimTrailingLines)
					.onChange(async (value) => {
						this.plugin.settings.TrimTrailingLines = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", {
			text: "Leading Characters",
		});

		new Setting(containerEl)
			.setName("Trim Leading Spaces")
			.setDesc("Trim spaces at the start of each line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimLeadingSpaces)
					.onChange(async (value) => {
						this.plugin.settings.TrimLeadingSpaces = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Leading Tabs")
			.setDesc("Trim tabs at the start of each line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimLeadingTabs)
					.onChange(async (value) => {
						this.plugin.settings.TrimLeadingTabs = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Leading Lines")
			.setDesc("Trim lines at the start of the document.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimLeadingLines)
					.onChange(async (value) => {
						this.plugin.settings.TrimLeadingLines = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", {
			text: "Mutiple Characters",
		});

		new Setting(containerEl)
			.setName("Trim Multiple Spaces")
			.setDesc("Trim groups of multiple inline spaces.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimMultipleSpaces)
					.onChange(async (value) => {
						this.plugin.settings.TrimMultipleSpaces = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Multiple Tabs")
			.setDesc("Trim groups of multiple inline tabs.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimMultipleTabs)
					.onChange(async (value) => {
						this.plugin.settings.TrimMultipleTabs = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Trim Multiple Lines")
			.setDesc("Trim groups of multiple blank lines.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.TrimMultipleLines)
					.onChange(async (value) => {
						this.plugin.settings.TrimMultipleLines = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
