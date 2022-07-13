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

export {
	_trimTrailingCharacters,
	_trimTrailingLines,
	_trimLeadingCharacters,
	_trimLeadingLines,
	_trimMultipleSpaces,
	_trimMultipleTabs,
	_trimMultipleLines,
};
