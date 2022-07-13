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
	_trimTrailingCharacters,
	_trimTrailingLines,
	_trimLeadingCharacters,
	_trimLeadingLines,
	_trimMultipleSpaces,
	_trimMultipleTabs,
	_trimMultipleLines,
} from "./utils/trimmers";

interface TrimWhitespaceSettings {
	TrimOnSave: boolean;

	TrimTrailingSpaces: boolean;
	TrimLeadingSpaces: boolean;
	TrimMultipleSpaces: boolean;

	TrimTrailingTabs: boolean;
	TrimLeadingTabs: boolean;
	TrimMultipleTabs: boolean;

	TrimTrailingLines: boolean;
	TrimLeadingLines: boolean;
	TrimMultipleLines: boolean;
}

const DEFAULT_SETTINGS: TrimWhitespaceSettings = {
	TrimOnSave: true,

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

function trimText(text: string, options: TrimWhitespaceSettings): string {
	let trimmed = text;
	const CHAR_SPACE = " ";
	const CHAR_TAB = "\t";

	if (options.TrimTrailingSpaces || options.TrimTrailingTabs) {
		const trailingCharacters = [];

		if (options.TrimTrailingSpaces) {
			trailingCharacters.push(CHAR_SPACE);
		}
		if (options.TrimTrailingTabs) {
			trailingCharacters.push(CHAR_TAB);
		}

		trimmed = _trimTrailingCharacters(trimmed, trailingCharacters);
	}

	if (options.TrimTrailingLines) {
		trimmed = _trimTrailingLines(trimmed);
	}

	if (options.TrimLeadingSpaces || options.TrimLeadingTabs) {
		const leadingCharacters = [];

		if (options.TrimLeadingSpaces) {
			leadingCharacters.push(CHAR_SPACE);
		}
		if (options.TrimLeadingTabs) {
			leadingCharacters.push(CHAR_TAB);
		}

		trimmed = _trimLeadingCharacters(trimmed, leadingCharacters);
	}

	if (options.TrimLeadingLines) {
		trimmed = _trimLeadingLines(trimmed);
	}

	if (options.TrimMultipleSpaces) {
		trimmed = _trimMultipleSpaces(trimmed);
	}

	if (options.TrimMultipleTabs) {
		trimmed = _trimMultipleTabs(trimmed);
	}

	if (options.TrimMultipleLines) {
		trimmed = _trimMultipleLines(trimmed);
	}

	return trimmed;
}

export default class TrimWhitespace extends Plugin {
	DEBOUNCE_TIMER = 2500;
	settings: TrimWhitespaceSettings;

	async onload() {
		await this.loadSettings();

		// Register event to trim on save, based on option
		this._toggleListenerEvent(this.settings.TrimOnSave);

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

	_getEditor(): Editor | null {
		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!markdownView) {
			return null;
		}

		return markdownView.editor;
	}

	debouncedTrim: Debouncer<[]> = debounce(
		this.trimDocument,
		this.DEBOUNCE_TIMER,
		true
	);

	_toggleListenerEvent(toggle: boolean): void {
		if (toggle) {
			this.registerEvent(
				this.app.metadataCache.on("changed", this.debouncedTrim, this)
				// this.app.vault.on("modify", this.trimDocument, this)
			);
		} else {
			this.app.metadataCache.off("changed", this.debouncedTrim);
			// this.app.vault.off("modify", this.trimDocument);
		}
	}

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

		const trimmed = trimText(input, this.settings);

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

		const trimmed = trimText(input, this.settings);

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

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

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
					.setValue(this.plugin.settings.TrimOnSave)
					.onChange(async (value) => {
						this.plugin.settings.TrimOnSave = value;
						await this.plugin.saveSettings();

						this.plugin._toggleListenerEvent(value);
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
			.setDesc("Trim groups of multiple spaces.")
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
			.setDesc("Trim groups of multiple tabs.")
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
