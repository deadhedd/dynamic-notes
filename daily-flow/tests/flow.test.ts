import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { advanceFlow, parseFlowDocument, validateFlowDocument } from '../src/flow';

const basicBefore = readFileSync(new URL('./fixtures/advance/basic.before.md', import.meta.url), 'utf8');
const basicAfter = readFileSync(new URL('./fixtures/advance/basic.after.md', import.meta.url), 'utf8');

function validDocument(now: string, later: string, done = ''): string {
	return `---\ndaily-flow: 1\n---\n\n# Any heading\n\n<!-- daily-flow:now -->\n${now}\n<!-- /daily-flow:now -->\n\n<!-- daily-flow:later -->\n${later}\n<!-- /daily-flow:later -->\n\n<!-- daily-flow:done -->\n${done}\n<!-- /daily-flow:done -->\n`;
}

function block(id: string, content = `## ${id}`): string {
	return `\n<!-- daily-flow:block:${id} -->\n${content}\n<!-- /daily-flow:block:${id} -->\n`;
}

function validationError(markdown: string): string | undefined {
	const parsed = parseFlowDocument(markdown);
	if (!parsed.ok) return parsed.error.message;
	const validated = validateFlowDocument(parsed.value);
	return validated.ok ? undefined : validated.error.message;
}

describe('Daily Flow parsing and validation', () => {
	it('parses a canonical note and ignores markers in fenced code', () => {
		const markdown = validDocument(
			block('morning', '```markdown\n<!-- daily-flow:block:example -->\n```'),
			block('later'),
		);
		const parsed = parseFlowDocument(markdown);
		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.value.now.blocks.map((item) => item.id)).toEqual(['morning']);
			expect(validateFlowDocument(parsed.value).ok).toBe(true);
		}
	});

	it.each([
		['missing opt-in', '<!-- daily-flow:now -->'],
		['unsupported version', validDocument(block('now'), block('later')).replace('daily-flow: 1', 'daily-flow: 2')],
		['missing now', validDocument(block('now'), block('later')).replace('<!-- daily-flow:now -->', '<!-- something -->')],
		['missing later', validDocument(block('now'), block('later')).replace('<!-- daily-flow:later -->', '<!-- something -->')],
		['missing done', validDocument(block('now'), block('later')).replace('<!-- daily-flow:done -->', '<!-- something -->')],
		['duplicate region', validDocument(block('now'), block('later')).replace('<!-- /daily-flow:done -->', '<!-- /daily-flow:done -->\n<!-- daily-flow:done -->\n<!-- /daily-flow:done -->')],
		['unclosed region', validDocument(block('now'), block('later')).replace('<!-- /daily-flow:now -->', '<!-- something -->')],
		['wrong order', validDocument(block('now'), block('later')).replace('<!-- daily-flow:now -->', '<!-- daily-flow:later -->')],
		['unclosed block', validDocument('\n<!-- daily-flow:block:now -->\n', '')],
		['mismatched block', validDocument('\n<!-- daily-flow:block:now -->\n<!-- /daily-flow:block:other -->\n', '')],
		['nested block', validDocument('\n<!-- daily-flow:block:now -->\n<!-- daily-flow:block:other -->\n<!-- /daily-flow:block:other -->\n<!-- /daily-flow:block:now -->\n', '')],
		['duplicate ids', validDocument(block('same'), block('same'))],
		['two now blocks', validDocument(block('first') + block('second'), '')],
		['free region text', validDocument(block('now'), '\nnot a block\n')],
		['unknown marker', validDocument(block('now'), block('later')).replace('<!-- daily-flow:done -->', '<!-- daily-flow:future -->')],
	])('rejects %s', (_name, markdown) => {
		expect(validationError(markdown)).toBeDefined();
	});
});

describe('advanceFlow', () => {
	it('matches the basic golden fixture', () => {
		const result = advanceFlow(basicBefore);
		expect(result).toEqual({ ok: true, value: { status: 'advanced', markdown: basicAfter, nextBlockOffset: basicAfter.indexOf('<!-- daily-flow:block:yard-work -->') } });
	});

	it('completes the final block without changing its raw Markdown', () => {
		const markdown = validDocument(block('evening', '## Evening\n- [ ] Finish'), '', block('morning'));
		const result = advanceFlow(markdown);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.status).toBe('advanced');
			expect(result.value.markdown).toContain('<!-- daily-flow:block:evening -->\n## Evening\n- [ ] Finish');
			expect(result.value.markdown.slice(result.value.markdown.indexOf('<!-- daily-flow:now -->'), result.value.markdown.indexOf('<!-- /daily-flow:now -->'))).not.toContain('evening');
		}
	});

	it('reports an already complete flow without a write', () => {
		const markdown = validDocument('', '', block('done'));
		expect(advanceFlow(markdown)).toEqual({ ok: true, value: { status: 'complete', markdown } });
	});

	it('does not return a transformation for malformed Markdown', () => {
		const malformed = validDocument(block('now'), '\nfree text\n');
		const result = advanceFlow(malformed);
		expect(result.ok).toBe(false);
	});
});
