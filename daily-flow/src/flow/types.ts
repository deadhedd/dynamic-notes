export type RegionName = 'now' | 'later' | 'done';

export interface FlowBlock {
	id: string;
	/** The block markers and all Markdown between them, excluding adjacent whitespace. */
	rawText: string;
	startOffset: number;
	endOffset: number;
}

export interface FlowRegion {
	name: RegionName;
	/** Offset immediately after the opening region marker's line ending. */
	contentStart: number;
	/** Offset at the start of the closing region marker. */
	contentEnd: number;
	blocks: FlowBlock[];
}

export interface FlowDocument {
	markdown: string;
	version: 1;
	now: FlowRegion;
	later: FlowRegion;
	done: FlowRegion;
}

export type FlowResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: FlowError };

export interface FlowError {
	message: string;
}

export type AdvanceStatus = 'advanced' | 'complete';

export interface AdvanceResult {
	status: AdvanceStatus;
	markdown: string;
	/** Offset of the promoted block, when a block was promoted. */
	nextBlockOffset?: number;
}
