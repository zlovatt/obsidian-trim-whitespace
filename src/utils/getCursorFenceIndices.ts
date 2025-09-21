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
	regex: RegExp,
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

	// Find the fence that contains the index
	const containingFence = matches.find((match) => {
		const rangeStart = match.index;
		const rangeEnd = rangeStart + match[0].length;

		return position >= rangeStart && position <= rangeEnd;
	});

	// If we're between fences but not actually in one, get out
	if (!containingFence) {
		return null;
	}

	// Finally, we must be in a fence; get the boundaries
	return {
		start: containingFence.index,
		end: containingFence.index + containingFence[0].length,
	};
}

/**
 * Gets start and end ranges of a code fence or whitespace block
 * that the cursor offset position is within
 *
 * @param str                String to get start/end fences in
 * @param cursorOffset       Cursor position to get fence locations from
 * @param preserveCodeBlocks Whether to preserve code blocks
 * @return                   Start/end block indices
 */
export default function getCursorFenceIndices(
	str: string,
	cursorOffset: number,
	preserveCodeBlocks: boolean,
): { start: number; end: number } {
	const CODE_BLOCK_REG = /(?:\s?)```([\s\S]+?)```(?:\s?)/gm;
	const WHITESPACE_BLOCK_REG = /\s+/gm;

	// Check code blocks, if applicable
	if (preserveCodeBlocks) {
		const cursorCodeBlockIndices = getStringBlockStartEndIndices(
			str,
			cursorOffset,
			CODE_BLOCK_REG,
		);

		if (cursorCodeBlockIndices) {
			// Offset by 1 to account for the wrapping newlines around valid code fences
			return {
				start: Math.max(cursorCodeBlockIndices.start - 1, 0),
				end: cursorCodeBlockIndices.end + 1,
			};
		}
	}

	const cursorWhiteSpaceIndices = getStringBlockStartEndIndices(
		str,
		cursorOffset,
		WHITESPACE_BLOCK_REG,
	);

	if (cursorWhiteSpaceIndices) {
		return {
			start: cursorWhiteSpaceIndices.start,
			end: cursorWhiteSpaceIndices.end,
		};
	}

	return {
		start: cursorOffset,
		end: cursorOffset,
	};
}
