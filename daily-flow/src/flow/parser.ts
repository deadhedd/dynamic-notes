import type { FlowBlock, FlowDocument, FlowError, FlowRegion, FlowResult, RegionName } from './types';

const REGION_NAMES: readonly RegionName[] = ['now', 'later', 'done'];
const BLOCK_ID = '[a-z0-9][a-z0-9-]*';
const REGION_START = new RegExp(`^\\s*<!--\\s*daily-flow:(${REGION_NAMES.join('|')})\\s*-->\\s*$`);
const REGION_END = new RegExp(`^\\s*<!--\\s*/daily-flow:(${REGION_NAMES.join('|')})\\s*-->\\s*$`);
const BLOCK_START = new RegExp(`^\\s*<!--\\s*daily-flow:block:(${BLOCK_ID})\\s*-->\\s*$`);
const BLOCK_END = new RegExp(`^\\s*<!--\\s*/daily-flow:block:(${BLOCK_ID})\\s*-->\\s*$`);
const DAILY_FLOW_COMMENT = /^\s*<!--\s*\/?daily-flow(?::[^\s-][^\s]*)?\s*-->\s*$/;
const FENCE_START = /^ {0,3}(`{3,}|~{3,})/;

interface Line {
	text: string;
	start: number;
	end: number;
	endWithoutLineEnding: number;
}

interface OpenBlock {
	id: string;
	startOffset: number;
}

interface OpenRegion {
	name: RegionName;
	contentStart: number;
	blocks: FlowBlock[];
}

function failure(message: string): FlowResult<never> {
	return { ok: false, error: { message } };
}

function linesOf(markdown: string): Line[] {
	const lines: Line[] = [];
	let start = 0;

	while (start < markdown.length) {
		const newline = markdown.indexOf('\n', start);
		const end = newline === -1 ? markdown.length : newline + 1;
		const endWithoutLineEnding = newline === -1 ? end : newline;
		const raw = markdown.slice(start, endWithoutLineEnding);
		lines.push({
			text: raw.endsWith('\r') ? raw.slice(0, -1) : raw,
			start,
			end,
			endWithoutLineEnding: raw.endsWith('\r') ? endWithoutLineEnding - 1 : endWithoutLineEnding,
		});
		start = end;
	}

	return lines;
}

function readVersion(markdown: string): FlowResult<1> {
	const lines = linesOf(markdown);
	if (lines.length === 0 || lines[0]?.text !== '---') {
		return failure('missing `daily-flow: 1` frontmatter');
	}

	let closingIndex = -1;
	for (let index = 1; index < lines.length; index += 1) {
		if (lines[index]?.text === '---') {
			closingIndex = index;
			break;
		}
	}
	if (closingIndex === -1) {
		return failure('frontmatter is not closed');
	}

	let value: string | undefined;
	for (let index = 1; index < closingIndex; index += 1) {
		const match = lines[index]?.text.match(/^\s*daily-flow\s*:\s*(.*?)\s*$/);
		if (match) {
			if (value !== undefined) return failure('duplicate `daily-flow` frontmatter property');
			value = match[1];
		}
	}

	if (value === undefined) return failure('missing `daily-flow: 1` frontmatter');
	if (value !== '1') return failure(`unsupported daily-flow version \`${value}\``);
	return { ok: true, value: 1 };
}

function isFenceStart(text: string): string | undefined {
	const match = text.match(FENCE_START);
	return match?.[1];
}

function isFenceEnd(text: string, fence: string): boolean {
	const character = fence[0];
	return character !== undefined && new RegExp(`^ {0,3}${character}{${fence.length},}\\s*$`).test(text);
}

function requireRegions(regions: Partial<Record<RegionName, FlowRegion>>): FlowResult<Record<RegionName, FlowRegion>> {
	for (const name of REGION_NAMES) {
		if (!regions[name]) return failure(`missing \`${name}\` region`);
	}
	return { ok: true, value: regions as Record<RegionName, FlowRegion> };
}

/** Parses the machine-readable structure only. Call validateFlowDocument before writing. */
export function parseFlowDocument(markdown: string): FlowResult<FlowDocument> {
	const version = readVersion(markdown);
	if (!version.ok) return version;

	const regions: Partial<Record<RegionName, FlowRegion>> = {};
	let openRegion: OpenRegion | undefined;
	let openBlock: OpenBlock | undefined;
	let fence: string | undefined;
	let expectedRegionIndex = 0;

	for (const line of linesOf(markdown)) {
		if (fence) {
			if (isFenceEnd(line.text, fence)) fence = undefined;
			continue;
		}
		const openingFence = isFenceStart(line.text);
		if (openingFence) {
			fence = openingFence;
			continue;
		}

		const startRegion = line.text.match(REGION_START);
		if (startRegion) {
			const name = startRegion[1] as RegionName;
			if (openBlock) return failure(`block \`${openBlock.id}\` is not closed`);
			if (openRegion) return failure(`region \`${openRegion.name}\` is not closed`);
			if (regions[name]) return failure(`duplicate \`${name}\` region`);
			if (REGION_NAMES[expectedRegionIndex] !== name) return failure('regions must appear in `now`, `later`, `done` order');
			expectedRegionIndex += 1;
			openRegion = { name, contentStart: line.end, blocks: [] };
			continue;
		}

		const endRegion = line.text.match(REGION_END);
		if (endRegion) {
			const name = endRegion[1] as RegionName;
			if (!openRegion) return failure(`closing \`${name}\` region has no opening marker`);
			if (openBlock) return failure(`block \`${openBlock.id}\` is not closed`);
			if (openRegion.name !== name) return failure(`closing \`${name}\` region does not match \`${openRegion.name}\``);
			regions[name] = { name, contentStart: openRegion.contentStart, contentEnd: line.start, blocks: openRegion.blocks };
			openRegion = undefined;
			continue;
		}

		const startBlock = line.text.match(BLOCK_START);
		if (startBlock) {
			const id = startBlock[1] as string;
			if (!openRegion) return failure(`block \`${id}\` is outside a managed region`);
			if (openBlock) return failure(`nested block \`${id}\` is not supported`);
			openBlock = { id, startOffset: line.start };
			continue;
		}

		const endBlock = line.text.match(BLOCK_END);
		if (endBlock) {
			const id = endBlock[1] as string;
			if (!openBlock) return failure(`closing block \`${id}\` has no opening marker`);
			if (openBlock.id !== id) return failure(`block \`${openBlock.id}\` is closed as \`${id}\``);
			if (!openRegion) return failure(`block \`${id}\` is outside a managed region`);
			const block: FlowBlock = {
				id,
				rawText: markdown.slice(openBlock.startOffset, line.endWithoutLineEnding),
				startOffset: openBlock.startOffset,
				endOffset: line.endWithoutLineEnding,
			};
			openRegion.blocks.push(block);
			openBlock = undefined;
			continue;
		}

		if (DAILY_FLOW_COMMENT.test(line.text)) return failure('unknown Daily Flow structural marker');
	}

	if (openBlock) return failure(`block \`${openBlock.id}\` is not closed`);
	if (openRegion) return failure(`region \`${openRegion.name}\` is not closed`);


	const completeRegions = requireRegions(regions);
	if (!completeRegions.ok) return completeRegions;
	return { ok: true, value: { markdown, version: version.value, ...completeRegions.value } };
}

export function flowErrorMessage(error: FlowError): string {
	return `Daily Flow: ${error.message}`;
}
