interface TrimWhitespaceSettings {
	AutoTrimDocument: boolean;
	AutoTrimTimeout: number;

	SkipCodeBlocks: boolean;

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

interface TokenReplaceMap {
	text: string;
	terms: string[];
}
