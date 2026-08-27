import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { project: "./tsconfig.json" },
		},

		// You can add your own configuration to override or add rules
		rules: {
			// example: turn off a rule from the recommended set
			// "obsidianmd/sample-names": "off",
			// example: add a rule not in the recommended set and set its severity
			// "obsidianmd/rule-custom-message": "off",

			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
			"obsidianmd/settings-tab/no-manual-html-headings": "off",
			"obsidianmd/settings-tab/prefer-setting-definitions": "off", // TODO: Remove once Settings API is implemented
		},
	},
]);
