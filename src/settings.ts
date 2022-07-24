import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import TrimWhitespace from "./main";

export class TrimWhitespaceSettingTab extends PluginSettingTab {
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
			text: "Trimming Rules",
		});

		containerEl.createEl("h3", {
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

		containerEl.createEl("h3", {
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

		containerEl.createEl("h3", {
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
