interface TrimWhitespaceSettings {
	TrimOnSave: boolean;

	AutoTrimDocument: boolean;
	AutoTrimTimeout: number;

	PreserveCodeBlocks: boolean;
	PreserveIndentedLists: boolean;
	ConvertNonBreakingSpaces: boolean;

	TrimTrailingSpaces: boolean;
	TrimLeadingSpaces: boolean;
	TrimMultipleSpaces: boolean;

	TrimTrailingTabs: boolean;
	TrimLeadingTabs: boolean;
	TrimMultipleTabs: boolean;

	TrimTrailingLines: boolean;
	TrimLeadingLines: boolean;
	TrimMultipleLines: boolean;

	TrailingLinesKeepMax: number;
}

interface TokenReplaceMap {
	text: string;
	terms: string[];
}
