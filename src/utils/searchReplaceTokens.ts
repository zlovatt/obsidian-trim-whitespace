/**
 * Cludgey function to:
 * 		- exec regexp on a string
 *    - swapping out matches with incremented prefix
 *    - keep track of swaps
 *    - return replaced string and terms
 *
 * @param text    Text to search and replace
 * @param prefix  Prefix incrementer should look for
 * @param regExps Collection of regular expressions to swap
 * @return        Replaced text with found terms
 */
function buildTokenReplaceMap(
	text: string,
	prefix: string,
	regExps: RegExp[]
): TokenReplaceMap {
	const textCollection = {
		text: text.toString(),
		terms: [],
	} as TokenReplaceMap;

	regExps.forEach((regExp) => {
		let replaced = regExp.exec(textCollection.text);

		if (!replaced) {
			return;
		}

		while (replaced) {
			const term = replaced[0];
			textCollection.terms.push(term);

			const replacedIndex = replaced.index;
			const tokenCount = textCollection.terms.length - 1;
			const token = `{{${prefix}${tokenCount.toString()}}}`;

			textCollection.text =
				textCollection.text.slice(0, replacedIndex) +
				token +
				textCollection.text.slice(replacedIndex + term.length);

			regExp.lastIndex = 0;
			replaced = regExp.exec(textCollection.text);
		}
	});

	return textCollection;
}

/**
 * Replace iteratable swapped tokens in text with matching terms
 *
 * @param text   Text to swap tokens in
 * @param prefix Search term prefix string
 * @param terms  Terms to swap
 * @return       Swapped token
 */
function replaceSwappedTokens(
	text: string,
	prefix: string,
	terms: string[]
): string {
	terms.forEach((term, ii) => {
		const token = `{{${prefix}${ii.toString()}}}`;
		text = decodeURIComponent(text.replace(token, encodeURIComponent(term)));
	});

	return text;
}

export { buildTokenReplaceMap, replaceSwappedTokens };
