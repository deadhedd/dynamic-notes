import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const verifierPath = join(repositoryRoot, 'scripts', 'verify-release-metadata.mjs');

function runVerifier(rootDirectory: string, environment: Record<string, string> = {}): string {
	const childEnvironment = { ...process.env };
	delete childEnvironment.GITHUB_REF;
	delete childEnvironment.GITHUB_REF_NAME;
	delete childEnvironment.GITHUB_REF_TYPE;
	Object.assign(childEnvironment, environment);

	return execFileSync(process.execPath, [verifierPath], {
		cwd: rootDirectory,
		env: childEnvironment,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function writeMetadata(rootDirectory: string, packageVersion = '0.2.1', manifestVersion = packageVersion, minimumAppVersion = '1.1.0'): void {
	writeFileSync(join(rootDirectory, 'package.json'), JSON.stringify({ version: packageVersion }));
	writeFileSync(join(rootDirectory, 'manifest.json'), JSON.stringify({ version: manifestVersion, minAppVersion: minimumAppVersion }));
	writeFileSync(join(rootDirectory, 'versions.json'), JSON.stringify({ [packageVersion]: minimumAppVersion }));
}

describe('release metadata verification', () => {
	it('passes the repository metadata without tag context', () => {
		expect(runVerifier(repositoryRoot)).toContain('version 0.2.1');
	});

	it('rejects a package and manifest version mismatch', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory, '0.2.2', '0.2.1');
			let error: { stderr?: Buffer | string } | undefined;
			try {
				runVerifier(rootDirectory);
			} catch (caught) {
				error = caught as { stderr?: Buffer | string };
			}
			expect(error).toBeDefined();
			expect(String(error?.stderr)).toContain('does not match manifest.json version');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('checks the tag and required release assets when tag context exists', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'main.js'), 'generated');
			expect(runVerifier(rootDirectory, { GITHUB_REF: 'refs/tags/0.2.1' })).toContain('Required release assets');
			rmSync(join(rootDirectory, 'main.js'));
			let error: { stderr?: Buffer | string } | undefined;
			try {
				runVerifier(rootDirectory, { GITHUB_REF: 'refs/tags/0.2.1' });
			} catch (caught) {
				error = caught as { stderr?: Buffer | string };
			}
			expect(error).toBeDefined();
			expect(String(error?.stderr)).toContain('requires release asset main.js');
		} finally {
			if (existsSync(rootDirectory)) rmSync(rootDirectory, { recursive: true, force: true });
		}
	});
});
