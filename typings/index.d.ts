interface TrimWhitespaceSettings {
	AutoTrimDocument: boolean;
	AutoTrimTimeout: number;

	PreserveCodeBlocks: boolean;
	PreserveIndentedLists: boolean;

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
