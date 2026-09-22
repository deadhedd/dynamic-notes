import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

function runVerifierExpectingFailure(rootDirectory: string, environment: Record<string, string> = {}): string {
	try {
		runVerifier(rootDirectory, environment);
	} catch (error) {
		return String((error as { stderr?: Buffer | string }).stderr);
	}

	throw new Error('Expected release metadata verification to fail.');
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

	it('exposes the verifier through the package script and both workflows', () => {
		const packageJson = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
		const ciWorkflow = readFileSync(join(repositoryRoot, '.github', 'workflows', 'ci.yml'), 'utf8');
		const releaseWorkflow = readFileSync(join(repositoryRoot, '.github', 'workflows', 'release.yml'), 'utf8');

		expect(packageJson.scripts?.['verify:release-metadata']).toBe('node scripts/verify-release-metadata.mjs');
		expect(ciWorkflow).toContain('run: npm run verify:release-metadata');
		expect(releaseWorkflow).toContain('run: npm run verify:release-metadata');
		expect(releaseWorkflow).toContain('npm run build');
		expect(releaseWorkflow.indexOf('npm run build')).toBeLessThan(releaseWorkflow.indexOf('run: npm run verify:release-metadata'));
	});

	it('rejects a package and manifest version mismatch', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory, '0.2.2', '0.2.1');
			expect(runVerifierExpectingFailure(rootDirectory)).toContain('does not match manifest.json version');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('rejects a missing versions entry for the package version', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'versions.json'), JSON.stringify({ '0.2.0': '1.1.0' }));

			expect(runVerifierExpectingFailure(rootDirectory)).toContain('must contain an entry for release version 0.2.1');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('rejects a versions entry with a different minimum app version', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'versions.json'), JSON.stringify({ '0.2.1': '1.2.0' }));

			expect(runVerifierExpectingFailure(rootDirectory)).toContain('manifest.json minAppVersion is 1.1.0');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('rejects a missing required manifest field', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'manifest.json'), JSON.stringify({ version: '0.2.1' }));

			expect(runVerifierExpectingFailure(rootDirectory)).toContain('manifest.json must define a nonempty minAppVersion string');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('rejects a tag that does not match the manifest version', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'main.js'), 'generated');
			writeFileSync(join(rootDirectory, 'manifest.json'), JSON.stringify({ version: '0.2.1', minAppVersion: '1.1.0' }));

			expect(runVerifierExpectingFailure(rootDirectory, { GITHUB_REF: 'refs/tags/0.2.0' })).toContain('release tag 0.2.0 does not match manifest.json version 0.2.1');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('accepts a tag name from GitHub tag environment variables', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'main.js'), 'generated');
			expect(runVerifier(rootDirectory, { GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: '0.2.1' })).toContain('release tag 0.2.1');
		} finally {
			rmSync(rootDirectory, { recursive: true, force: true });
		}
	});

	it('checks the tag and required release assets when tag context exists', () => {
		const rootDirectory = mkdtempSync(join(tmpdir(), 'dynamic-notes-release-metadata-'));
		try {
			writeMetadata(rootDirectory);
			writeFileSync(join(rootDirectory, 'main.js'), 'generated');
			writeFileSync(join(rootDirectory, 'manifest.json'), JSON.stringify({ version: '0.2.1', minAppVersion: '1.1.0' }));
			expect(runVerifier(rootDirectory, { GITHUB_REF: 'refs/tags/0.2.1' })).toContain('Required release assets');
			rmSync(join(rootDirectory, 'main.js'));
			expect(runVerifierExpectingFailure(rootDirectory, { GITHUB_REF: 'refs/tags/0.2.1' })).toContain('requires release asset main.js');
		} finally {
			if (existsSync(rootDirectory)) rmSync(rootDirectory, { recursive: true, force: true });
		}
	});
});
