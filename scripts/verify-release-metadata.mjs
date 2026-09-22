import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function readJson(path, label) {
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`could not read ${label}: ${detail}`);
	}
}

function isFile(path) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

export function releaseTagFromEnvironment(environment = process.env) {
	if (environment.GITHUB_REF?.startsWith('refs/tags/')) {
		return environment.GITHUB_REF.slice('refs/tags/'.length);
	}

	if (environment.GITHUB_REF_TYPE === 'tag' && environment.GITHUB_REF_NAME) {
		return environment.GITHUB_REF_NAME;
	}

	return undefined;
}

export function verifyReleaseMetadata({ rootDirectory = process.cwd(), tag = releaseTagFromEnvironment() } = {}) {
	const errors = [];
	let packageJson;
	let manifest;
	let versions;

	try {
		packageJson = readJson(join(rootDirectory, 'package.json'), 'package.json');
		manifest = readJson(join(rootDirectory, 'manifest.json'), 'manifest.json');
		versions = readJson(join(rootDirectory, 'versions.json'), 'versions.json');
	} catch (error) {
		return { errors: [error instanceof Error ? error.message : String(error)], version: undefined };
	}

	const packageVersion = packageJson.version;
	const manifestVersion = manifest.version;
	const minimumAppVersion = manifest.minAppVersion;

	if (typeof packageVersion !== 'string' || packageVersion.length === 0) {
		errors.push('package.json must define a nonempty version string.');
	}

	if (typeof manifestVersion !== 'string' || manifestVersion.length === 0) {
		errors.push('manifest.json must define a nonempty version string.');
	}

	if (typeof minimumAppVersion !== 'string' || minimumAppVersion.length === 0) {
		errors.push('manifest.json must define a nonempty minAppVersion string.');
	}

	if (typeof packageVersion === 'string' && typeof manifestVersion === 'string' && packageVersion !== manifestVersion) {
		errors.push(`package.json version ${packageVersion} does not match manifest.json version ${manifestVersion}.`);
	}

	if (versions === null || typeof versions !== 'object' || Array.isArray(versions)) {
		errors.push('versions.json must contain an object of release versions and minimum app versions.');
	} else if (typeof packageVersion === 'string') {
		const recordedMinimumAppVersion = versions[packageVersion];
		if (typeof recordedMinimumAppVersion !== 'string') {
			errors.push(`versions.json must contain an entry for release version ${packageVersion}.`);
		} else if (typeof minimumAppVersion === 'string' && recordedMinimumAppVersion !== minimumAppVersion) {
			errors.push(`versions.json entry for ${packageVersion} is ${recordedMinimumAppVersion}, but manifest.json minAppVersion is ${minimumAppVersion}.`);
		}
	}

	if (tag !== undefined && typeof manifestVersion === 'string' && tag !== manifestVersion) {
		errors.push(`release tag ${tag} does not match manifest.json version ${manifestVersion}.`);
	}

	if (tag !== undefined) {
		for (const asset of ['main.js', 'manifest.json']) {
			if (!isFile(join(rootDirectory, asset))) {
				errors.push(`tagged release ${tag} requires release asset ${asset}; run npm run build before verification.`);
			}
		}
	}

	return { errors, version: typeof packageVersion === 'string' ? packageVersion : undefined };
}

const tag = releaseTagFromEnvironment();
const result = verifyReleaseMetadata({ tag });

if (result.errors.length > 0) {
	console.error('Release metadata verification failed:');
	for (const error of result.errors) {
		console.error(`  ${error}`);
	}
	process.exitCode = 1;
} else {
	const tagContext = tag === undefined ? '' : ` and release tag ${tag}`;
	console.log(`Release metadata is consistent for version ${result.version}${tagContext}.`);
	if (tag !== undefined) {
		console.log('Required release assets are present: main.js, manifest.json.');
	}
}
