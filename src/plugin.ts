import { Message, Plugin } from 'esbuild';
import chalk from 'chalk';
import kill from 'tree-kill';
import { performance } from 'perf_hooks';
import execa, { ExecaChildProcess } from 'execa';

const namespace = chalk.green('[ monitor ]');

function getBuildTime(startTime: number) {
	const buildTime = performance.now() - startTime;
	if (buildTime > 1000) {
		const seconds = buildTime / 1000;
		return seconds.toFixed(2) + 's';
	}
	return Math.round(buildTime) + 'ms';
}

function printStartMessage(isFirstRun: boolean) {
	if (isFirstRun) {
		console.log(`${namespace} Build started. Watching for file changes.`);
	} else {
		console.log(`${namespace} File change detected. Started build.`);
	}
}

function printEndMessage(isFirstRun: boolean, startTime: number, errors: Message[]) {
	if (errors.length > 0) {
		return;
	}

	const buildTime = chalk.grey(getBuildTime(startTime));

	const success = `Build finished successfully in ${buildTime}.`;
	const restart = `${isFirstRun ? 'Starting' : 'Restarting'} app...`;

	console.log(`${namespace} ${success} ${restart}`);
}

async function killProcess(pid: number) {
	return new Promise<void>((resolve) => {
		kill(pid, 'SIGKILL', () => resolve());
	});
}

let processes: ExecaChildProcess[] = [];

async function killProcesses() {
	const pids = processes.map((process) => process.pid);
	processes = [];
	return Promise.all(pids.map((pid) => killProcess(pid)));
}

async function handleError(onError?: string) {
	if (!onError) return;

	processes.push(
		execa.command(onError, {
			stdout: process.stdout,
		})
	);
}

async function handleSuccess(onSuccess?: string) {
	if (!onSuccess) {
		return;
	}

	processes.push(
		execa.command(onSuccess, {
			stdin: process.stdin,
			stdout: process.stdout,
			stderr: process.stderr,
		})
	);
}

export interface EsbuildCommandsOptions {
	/**
	 * @description Command to run after build succeeded
	 */
	onSuccess?: string;

	/**
	 * @description Command to run after the build failed
	 */
	onError?: string;
}

export function esbuildCommands({ onSuccess, onError }: EsbuildCommandsOptions): Plugin {
	let isFirstRun = true;
	let startTime = 0;

	return {
		name: 'esbuild-plugin-commands',
		setup(build) {
			build.onStart(() => {
				printStartMessage(isFirstRun);
				startTime = performance.now();
				isFirstRun = false;
			});

			build.onEnd(async (result) => {
				printEndMessage(isFirstRun, startTime, result.errors);

				await killProcesses();

				if (result.errors.length > 0) {
					return handleError(onError);
				}

				return handleSuccess(onSuccess);
			});
		},
	};
}

export default esbuildCommands;
