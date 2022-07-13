/** Trailing */
function _trimTrailingCharacters(str: string, chars: string[]): string {
	const reg = new RegExp(`(${chars.join("|")})+$`, "gm");
	return str.replace(reg, "");
}

function _trimTrailingLines(str: string): string {
	return str.trimEnd();
}

/** Leading */
function _trimLeadingCharacters(str: string, chars: string[]): string {
	const reg = new RegExp(`^(${chars.join("|")})+`, "gm");
	return str.replace(reg, "");
}

function _trimLeadingLines(str: string): string {
	return str.trimStart();
}

/** Multiple */
function _trimMultipleSpaces(str: string): string {
	return str.replace(/(?<!(\||^)\s*)( ){2,}(?!\s*(\||$))/gm, " ");
}

function _trimMultipleTabs(str: string): string {
	return str.replace(/(?<!(\||^)\s*)(\t){2,}(?!\s*(\||$))/gm, "\t");
}

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
