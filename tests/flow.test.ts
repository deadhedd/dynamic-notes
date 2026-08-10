import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { advanceFlow, parseFlowDocument, validateFlowDocument } from '../src/flow';

const basicBefore = readFileSync(new URL('./fixtures/advance/basic.before.md', import.meta.url), 'utf8');
const basicAfter = readFileSync(new URL('./fixtures/advance/basic.after.md', import.meta.url), 'utf8');

function validDocument(now: string, later: string, done = ''): string {
	return `---\ndynamic-notes: 1\n---\n\n# Any heading\n\n<!-- dynamic-notes:now -->\n${now}\n<!-- /dynamic-notes:now -->\n\n<!-- dynamic-notes:later -->\n${later}\n<!-- /dynamic-notes:later -->\n\n<!-- dynamic-notes:done -->\n${done}\n<!-- /dynamic-notes:done -->\n`;
}

function block(id: string, content = `## ${id}`): string {
	return `\n<!-- dynamic-notes:block:${id} -->\n${content}\n<!-- /dynamic-notes:block:${id} -->\n`;
}

function validationError(markdown: string): string | undefined {
	const parsed = parseFlowDocument(markdown);
	if (!parsed.ok) return parsed.error.message;
	const validated = validateFlowDocument(parsed.value);
	return validated.ok ? undefined : validated.error.message;
}

describe('Dynamic Notes parsing and validation', () => {
	it('parses a canonical note and ignores markers in fenced code', () => {
		const markdown = validDocument(
			block('morning', '```markdown\n<!-- dynamic-notes:block:example -->\n```'),
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
		['missing opt-in', '<!-- dynamic-notes:now -->'],
		['unsupported version', validDocument(block('now'), block('later')).replace('dynamic-notes: 1', 'dynamic-notes: 2')],
		['missing now', validDocument(block('now'), block('later')).replace('<!-- dynamic-notes:now -->', '<!-- something -->')],
		['missing later', validDocument(block('now'), block('later')).replace('<!-- dynamic-notes:later -->', '<!-- something -->')],
		['missing done', validDocument(block('now'), block('later')).replace('<!-- dynamic-notes:done -->', '<!-- something -->')],
		['duplicate region', validDocument(block('now'), block('later')).replace('<!-- /dynamic-notes:done -->', '<!-- /dynamic-notes:done -->\n<!-- dynamic-notes:done -->\n<!-- /dynamic-notes:done -->')],
		['unclosed region', validDocument(block('now'), block('later')).replace('<!-- /dynamic-notes:now -->', '<!-- something -->')],
		['wrong order', validDocument(block('now'), block('later')).replace('<!-- dynamic-notes:now -->', '<!-- dynamic-notes:later -->')],
		['unclosed block', validDocument('\n<!-- dynamic-notes:block:now -->\n', '')],
		['mismatched block', validDocument('\n<!-- dynamic-notes:block:now -->\n<!-- /dynamic-notes:block:other -->\n', '')],
		['nested block', validDocument('\n<!-- dynamic-notes:block:now -->\n<!-- dynamic-notes:block:other -->\n<!-- /dynamic-notes:block:other -->\n<!-- /dynamic-notes:block:now -->\n', '')],
		['duplicate ids', validDocument(block('same'), block('same'))],
		['two now blocks', validDocument(block('first') + block('second'), '')],
		['free region text', validDocument(block('now'), '\nnot a block\n')],
		['unknown marker', validDocument(block('now'), block('later')).replace('<!-- dynamic-notes:done -->', '<!-- dynamic-notes:future -->')],
	])('rejects %s', (_name, markdown) => {
		expect(validationError(markdown)).toBeDefined();
	});
});

describe('advanceFlow', () => {
	it('matches the basic golden fixture', () => {
		const result = advanceFlow(basicBefore);
		expect(result).toEqual({ ok: true, value: { status: 'advanced', markdown: basicAfter, nextBlockOffset: basicAfter.indexOf('<!-- dynamic-notes:block:yard-work -->') } });
	});

	it('completes the final block without changing its raw Markdown', () => {
		const markdown = validDocument(block('evening', '## Evening\n- [ ] Finish'), '', block('morning'));
		const result = advanceFlow(markdown);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.status).toBe('advanced');
			expect(result.value.markdown).toContain('<!-- dynamic-notes:block:evening -->\n## Evening\n- [ ] Finish');
			expect(result.value.markdown.slice(result.value.markdown.indexOf('<!-- dynamic-notes:now -->'), result.value.markdown.indexOf('<!-- /dynamic-notes:now -->'))).not.toContain('evening');
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
