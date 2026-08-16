import { parseFlowDocument } from './parser';
import { validateFlowDocument } from './validator';
import type { AdvanceResult, FlowResult, FlowBlock, FlowRegion, ResetResult } from './types';

interface Replacement {
	start: number;
	end: number;
	text: string;
}

function applyReplacements(markdown: string, replacements: Replacement[]): string {
	return [...replacements]
		.sort((left, right) => right.start - left.start)
		.reduce((result, replacement) => result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end), markdown);
}

function movableText(markdown: string, block: FlowBlock, region: FlowRegion): string {
	const nextBlock = region.blocks[region.blocks.indexOf(block) + 1];
	return markdown.slice(block.startOffset, nextBlock?.startOffset ?? region.contentEnd);
}

/**
 * Moves the current block to Done and promotes the first Later block. It returns
 * the full replacement text and never writes to an editor or file.
 */
export function advanceFlow(markdown: string): FlowResult<AdvanceResult> {
	const parsed = parseFlowDocument(markdown);
	if (!parsed.ok) return parsed;
	const validated = validateFlowDocument(parsed.value);
	if (!validated.ok) return validated;
	const document = validated.value;
	const current = document.now.blocks[0];
	if (!current) {
		return { ok: true, value: { status: 'complete', markdown } };
	}

	const next = document.later.blocks[0];
	const currentText = movableText(markdown, current, document.now);
	const nextText = next ? movableText(markdown, next, document.later) : '';
	const replacements: Replacement[] = [
		{ start: current.startOffset, end: document.now.contentEnd, text: nextText },
		{ start: document.done.contentEnd, end: document.done.contentEnd, text: currentText },
	];
	if (next) replacements.push({ start: next.startOffset, end: next.startOffset + nextText.length, text: '' });

	const nextBlockOffset = next ? current.startOffset : undefined;
	return {
		ok: true,
		value: { status: 'advanced', markdown: applyReplacements(markdown, replacements), nextBlockOffset },
	};
}

function regionText(blocks: FlowBlock[]): string {
	return blocks.length === 0 ? '\n' : `\n${blocks.map((block) => block.rawText).join('\n\n')}\n\n`;
}

/** Restores the flow queue using Done completion order, then Now and Later. */
export function resetFlow(markdown: string): FlowResult<ResetResult> {
	const parsed = parseFlowDocument(markdown);
	if (!parsed.ok) return parsed;
	const validated = validateFlowDocument(parsed.value);
	if (!validated.ok) return validated;
	const document = validated.value;
	const restored = [...document.done.blocks, ...document.now.blocks, ...document.later.blocks];
	const current = restored.slice(0, 1);
	const later = restored.slice(1);
	const nowText = regionText(current);

	return {
		ok: true,
		value: {
			markdown: applyReplacements(markdown, [
				{ start: document.now.contentStart, end: document.now.contentEnd, text: nowText },
				{ start: document.later.contentStart, end: document.later.contentEnd, text: regionText(later) },
				{ start: document.done.contentStart, end: document.done.contentEnd, text: '\n' },
			]),
			nextBlockOffset: current[0] ? document.now.contentStart + 1 : undefined,
		},
	};
}
