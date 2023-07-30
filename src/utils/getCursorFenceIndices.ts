/**
 * Checks whether the character in the string at a given position
 * falls into a block of text detected by a given regex.
 *
 * Returns an object with the start/end indices of that block as well as
 * info on whether the character is in a block at all/
 *
 * @param str      String to search within
 * @param position Character position to start search from
 * @param regex    RegExp to use to detect block
 * @return         Indices data
 */
function getStringBlockStartEndIndices(
	str: string,
	position: number,
	regex: RegExp
): null | { start: number; end: number } {
	const matches = [];
	let match = regex.exec(str);

	while (match) {
		matches.push(match);
		match = regex.exec(str);
	}

	// If there are no code fences, just get the index
	if (matches.length === 0) {
		return null;
	}

	const firstMatch = matches[0];
	const lastMatch = matches[matches.length - 1];

	// If the current index is before the first match's index, or after the last match, we're already good
	// ztodo: This may not be necessary.....
	if (
		position < firstMatch.index ||
		position > lastMatch.index + lastMatch[0].length
	) {
		return null;
	}

	// Find the fence that contains the index
	const containingFence = matches.find((match) => {
		const rangeStart = match.index;
		const rangeEnd = rangeStart + match[0].length;

		return position >= rangeStart && position <= rangeEnd;
	});

	// ztodo: can we remove this?
	// If we're between fences but not actually in one, get out
	if (!containingFence) {
		return null;
	}

	// Finally, we must be in a fence
	return {
		start: containingFence.index,
		end: containingFence.index + containingFence[0].length,
	};
}

/**
 * Gets start and end ranges of a code fence or whitespace block
 * that the cursor offset position is within
 *
 * @param str          String to get start/end fences in
 * @param cursorOffset Cursor position to get fence locations from
 * @return             Start/end block indices
 */
export default function getCursorFenceIndices(
	str: string,
	cursorOffset: number
): { start: number; end: number } {
	const CODE_BLOCK_REG = /(?:\s?)```([\s\S]+?)```(?:\s?)/gm;
	const WHITESPACE_BLOCK_REG = /\s+/gm;

	const cursorRange = { start: cursorOffset, end: cursorOffset };

	const cursorCodeBlockIndices = getStringBlockStartEndIndices(
		str,
		cursorOffset,
		CODE_BLOCK_REG
	);

	if (cursorCodeBlockIndices) {
		// Offset by 1 to account for the wrapping newlines around valid code fences
		cursorRange.start = cursorCodeBlockIndices.start - 1;
		cursorRange.end = cursorCodeBlockIndices.end + 1;
	} else {
		const cursorWhiteSpaceIndices = getStringBlockStartEndIndices(
			str,
			cursorOffset,
			WHITESPACE_BLOCK_REG
		);

		if (cursorWhiteSpaceIndices) {
			cursorRange.start = cursorWhiteSpaceIndices.start;
			cursorRange.end = cursorWhiteSpaceIndices.end;
		}
	}

	return cursorRange;
}
