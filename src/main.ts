import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { advanceFlow, flowErrorMessage, parseFlowDocument, resetFlow, validateFlowDocument } from './flow';

class FlowOperationAborted extends Error {
	constructor(readonly reason: 'complete' | 'invalid', readonly detail?: string) {
		super(reason);
	}
}

export default class DynamicNotesPlugin extends Plugin {
	onload(): void {
		this.addRibbonIcon('circle-arrow-right', 'Advance flow', () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view?.file) {
				new Notice('Open a Markdown note first');
				return;
			}
			void this.advance(view);
		});

		this.addCommand({
			id: 'advance',
			name: 'Advance',
			checkCallback: (checking) => this.whenActiveMarkdownView(checking, (view) => this.advance(view)),
		});

		this.addCommand({
			id: 'reset',
			name: 'Reset flow',
			checkCallback: (checking) => this.whenActiveMarkdownView(checking, (view) => this.reset(view)),
		});

		this.addCommand({
			id: 'validate-current-note',
			name: 'Validate active note',
			checkCallback: (checking) => this.whenActiveMarkdownView(checking, (view) => this.validate(view)),
		});
	}

	private whenActiveMarkdownView(checking: boolean, action: (view: MarkdownView) => Promise<void>): boolean {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) return false;
		if (!checking) void action(view);
		return true;
	}

	private async validate(view: MarkdownView): Promise<void> {
		const markdown = view.getMode() === 'source'
			? view.editor.getValue()
			: await this.app.vault.read(this.requireFile(view));
		this.validateMarkdown(markdown);
	}

	private validateMarkdown(markdown: string): boolean {
		const parsed = parseFlowDocument(markdown);
		if (!parsed.ok) {
			this.report(parsed.error.message);
			return false;
		}
		const validated = validateFlowDocument(parsed.value);
		if (!validated.ok) {
			this.report(validated.error.message);
			return false;
		}
		new Notice('Note is valid');
		return true;
	}

	private async advance(view: MarkdownView): Promise<void> {
		if (view.getMode() === 'source') {
			this.advanceEditor(view.editor);
			return;
		}
		await this.advanceFile(this.requireFile(view));
	}

	private async reset(view: MarkdownView): Promise<void> {
		if (view.getMode() === 'source') {
			this.resetEditor(view.editor);
			return;
		}
		await this.resetFile(this.requireFile(view));
	}


	private advanceEditor(editor: Editor): void {
		const result = advanceFlow(editor.getValue());
		if (!result.ok) {
			this.report(result.error.message);
			return;
		}
		if (result.value.status === 'complete') {
			new Notice('Flow is already complete');
			return;
		}

		// A single Editor operation keeps the transition as one ordinary undo step.
		editor.setValue(result.value.markdown);
		if (result.value.nextBlockOffset !== undefined) {
			editor.setCursor(editor.offsetToPos(result.value.nextBlockOffset));
		}
		new Notice(result.value.nextBlockOffset === undefined ? 'Flow complete' : 'Flow advanced');
	}

	private async advanceFile(file: TFile): Promise<void> {
		try {
			await this.app.vault.process(file, (markdown) => {
				const result = advanceFlow(markdown);
				if (!result.ok) throw new FlowOperationAborted('invalid', result.error.message);
				if (result.value.status === 'complete') throw new FlowOperationAborted('complete');
				return result.value.markdown;
			});
			new Notice('Flow advanced');
		} catch (error) {
			if (error instanceof FlowOperationAborted) {
				if (error.reason === 'complete') new Notice('Flow is already complete');
				else this.report(error.detail ?? 'unable to advance this note');
				return;
			}
			console.error('[Dynamic Notes] unable to advance note in Reading view', error);
			new Notice('Unable to update the current note');
		}
	}

	private resetEditor(editor: Editor): void {
		const result = resetFlow(editor.getValue());
		if (!result.ok) {
			this.report(result.error.message);
			return;
		}
		editor.setValue(result.value.markdown);
		if (result.value.nextBlockOffset !== undefined) {
			editor.setCursor(editor.offsetToPos(result.value.nextBlockOffset));
		}
		new Notice('Flow reset');
	}

	private async resetFile(file: TFile): Promise<void> {
		try {
			await this.app.vault.process(file, (markdown) => {
				const result = resetFlow(markdown);
				if (!result.ok) throw new FlowOperationAborted('invalid', result.error.message);
				return result.value.markdown;
			});
			new Notice('Flow reset');
		} catch (error) {
			if (error instanceof FlowOperationAborted) {
				this.report(error.detail ?? 'unable to reset this note');
				return;
			}
			console.error('[Dynamic Notes] unable to reset note in Reading view', error);
			new Notice('Unable to update the current note');
		}
	}

	private requireFile(view: MarkdownView): TFile {
		if (!view.file) throw new Error('Dynamic Notes requires an active Markdown file');
		return view.file;
	}

	private report(message: string): void {
		console.error('[Dynamic Notes] ' + message);
		new Notice(flowErrorMessage({ message }));
	}
}
