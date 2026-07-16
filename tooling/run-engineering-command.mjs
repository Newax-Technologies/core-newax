import { spawn } from 'node:child_process';

import { appendLocalEvent, createEngineeringEvent } from './engineering-learning-core.mjs';

const separatorIndex = process.argv.indexOf('--');
const commandArguments =
  separatorIndex === -1 ? process.argv.slice(2) : process.argv.slice(separatorIndex + 1);
const [command, ...argumentsList] = commandArguments;

if (command === undefined) {
  throw new Error('Usage: node tooling/run-engineering-command.mjs -- <command> [arguments]');
}

const output = [];
const child = spawn(command, argumentsList, {
  env: process.env,
  shell: process.platform === 'win32',
  stdio: ['inherit', 'pipe', 'pipe'],
});

for (const stream of [child.stdout, child.stderr]) {
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    output.push(text);
    const target = stream === child.stdout ? process.stdout : process.stderr;
    target.write(text);
  });
}

const exitCode = await new Promise((resolve, reject) => {
  child.on('error', reject);
  child.on('close', (code) => resolve(code ?? 1));
});

if (exitCode !== 0 && process.env.CI !== 'true') {
  const event = createEngineeringEvent({
    sourceType: 'local-command',
    sourceId: `${command} ${argumentsList.join(' ')}`.trim(),
    repository: process.env.GITHUB_REPOSITORY ?? null,
    commitSha: process.env.GITHUB_SHA ?? null,
    stepName: `${command} ${argumentsList.join(' ')}`.trim(),
    logText: output.join('').slice(-100_000),
    evidenceUrls: [],
  });
  const path = appendLocalEvent(event);
  process.stderr.write(`\nNEWAX engineering failure queued at ${path}.\n`);
}

process.exit(exitCode);
