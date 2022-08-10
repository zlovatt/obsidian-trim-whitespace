import {
	buildTokenReplaceMap,
	replaceSwappedTokens,
} from "./searchReplaceTokens";

/** Trailing */

/**
 * Trims trailing characters at end of each line
 *
 * @param str   Text to trim
 * @param chars Characters to trim
 * @return      Trimmed text
 */
function _trimTrailingCharacters(str: string, chars: string[]): string {
	const reg = new RegExp(`(${chars.join("|")})+$`, "gm");
	return str.replace(reg, "");
}

/**
 * Trims empty lines at the end of the document
 *
 * @param str Text to trim
 * @return    Trimmed text
 */
function _trimTrailingLines(str: string): string {
	return str.trimEnd();
}

/** Leading */

/**
 * Trims leading characters at start of each line
 *
 * @param str   Text to trim
 * @param chars Characters to trim
 * @return      Trimmed text
 */
function _trimLeadingCharacters(str: string, chars: string[]): string {
	const reg = new RegExp(`^(${chars.join("|")})+`, "gm");
	return str.replace(reg, "");
}

/**
 * Trims empty lines at the start of the document
 *
 * @param str Text to trim
 * @return    Trimmed text
 */
function _trimLeadingLines(str: string): string {
	return str.trimStart();
}

/** Multiple */

/**
 * Trims groups of multiple inline spaces
 *
 * @param str Text to trim
 * @return    Trimmed text
 */
function _trimMultipleSpaces(str: string): string {
	return str.replace(/(?<!(\||^)\s*)( ){2,}(?!\s*(\||$))/gm, " ");
}

/**
 * Trims groups of multiple inline tabs
 *
 * @param str Text to trim
 * @return    Trimmed text
 */
function _trimMultipleTabs(str: string): string {
	return str.replace(/(?<!(\||^)\s*)(\t){2,}(?!\s*(\||$))/gm, "\t");
}

/**
 * Trims groups of multiple blank lines
 *
 * @param str Text to trim
 * @return    Trimmed text
 */
function _trimMultipleLines(str: string): string {
	return str.replace(/^\s+(?=(\n|\r|$))/gm, "");
}

/**
 * Trims text according to settings
 *
 * @param text    Text to trim
 * @param options Preferences to control trimming
 * @return        Trimmed string
 */
function trimText(
	text: string,
	options: TrimWhitespaceSettings
): string {
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

/**
 * Trims text, skipping code blocks if applicable
 *
 * @param  text Text to trim
 * @return      Trimmed text
 */
export default function handleTextTrim(
	text: string,
	settings: TrimWhitespaceSettings
): string {
	let terms: string[] = [];
	const skipCodeBlocks = settings.SkipCodeBlocks;

	const CODE_SWAP_PREFIX = "TRIM_WHITESPACE_REPLACE_";
	const CODE_SWAP_REGEX = [
		new RegExp(/```([\s\S]+?)```/gm), // markdown code fences
		new RegExp(/`([\s\S]+?)`/gm), // markdown code inline
	];

	if (skipCodeBlocks) {
		const swapData = buildTokenReplaceMap(
			text,
			CODE_SWAP_PREFIX,
			CODE_SWAP_REGEX
		);
		text = swapData.text;
		terms = swapData.terms;
	}

	let trimmed = trimText(text, settings);

	if (skipCodeBlocks) {
		trimmed = replaceSwappedTokens(trimmed, CODE_SWAP_PREFIX, terms);
	}

	return trimmed;
}
