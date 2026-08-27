import { Notice } from "obsidian";

export async function parseSettingAsNumber(value: string) {
	if (value.length < 1) return 0;
	else if (value.length == 1 && value === "-") return 0;

	const textAsNumber = parseFloat(value);

	if (isNaN(textAsNumber)) {
		new Notice("Trim whitespace: Enter a valid number!");
		throw "Trim whitespace: Enter a valid number!";
	}

	return textAsNumber;
}
