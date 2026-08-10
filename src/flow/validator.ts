import type { FlowDocument, FlowError, FlowResult, FlowRegion } from './types';

function failure(message: string): FlowResult<never> {
	return { ok: false, error: { message } };
}

function hasOnlyWhitespaceOutsideBlocks(document: FlowDocument, region: FlowRegion): boolean {
	let position = region.contentStart;
	for (const block of region.blocks) {
		if (document.markdown.slice(position, block.startOffset).trim().length > 0) return false;
		position = block.endOffset;
	}
	return document.markdown.slice(position, region.contentEnd).trim().length === 0;
}

/** Validates all v0.1 invariants that are independent of Obsidian. */
export function validateFlowDocument(document: FlowDocument): FlowResult<FlowDocument> {
	const ids = new Set<string>();
	for (const region of [document.now, document.later, document.done]) {
		if (!hasOnlyWhitespaceOutsideBlocks(document, region)) {
			return failure(`\`${region.name}\` contains content outside Dynamic Notes blocks`);
		}
		for (const block of region.blocks) {
			if (ids.has(block.id)) return failure(`duplicate block ID \`${block.id}\``);
			ids.add(block.id);
		}
	}

	if (document.now.blocks.length > 1) return failure('`now` contains more than one block');
	if (document.now.blocks.length === 0 && document.later.blocks.length > 0) {
		return failure('`now` is empty while `later` contains work');
	}
	return { ok: true, value: document };
}

export function validationErrorMessage(error: FlowError): string {
	return `Dynamic Notes: ${error.message}`;
}
