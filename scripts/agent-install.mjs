import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function readArgs(argv) {
  const options = { repo: undefined, dir: undefined, mode: 'automatic', yes: false, systemProxy: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo') options.repo = argv[++index];
    else if (arg === '--dir') options.dir = argv[++index];
    else if (arg === '--mode') options.mode = argv[++index];
    else if (arg === '--yes') options.yes = true;
    else if (arg === '--no-system-proxy') options.systemProxy = false;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run setup:ai -- --repo <github-url> [--mode automatic|manual] [--yes] [--no-system-proxy]');
      process.exit(0);
    } else throw new Error(`unknown option ${arg}`);
  }
  return options;
}

function run(command, args, cwd) {
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
  const result = spawnSync(executable, args, { cwd, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
}

function validateRepo(value) {
  if (!value) return undefined;
  let url;
  try { url = new URL(value); } catch { throw new Error('--repo must be an HTTPS GitHub repository URL'); }
  if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) throw new Error('--repo must point to github.com over HTTPS');
  return url.toString().replace(/\/$/, '');
}

function hasProject(dir) {
  return existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src'));
}

try {
  const options = readArgs(process.argv.slice(2));
  if (!options.yes) throw new Error('This changes local dependencies and network settings. Re-run with --yes after the user approves the GitHub repository.');
  const repo = validateRepo(options.repo);
  let projectDir = resolve(options.dir ?? process.cwd());
  if (!hasProject(projectDir)) {
    if (!repo) throw new Error('run this from the aidigest repository or provide --repo and --dir');
    if (!options.dir) projectDir = resolve(process.cwd(), 'aidigest');
    if (existsSync(projectDir)) throw new Error(`target directory is not an aidigest project: ${projectDir}`);
    run('git', ['clone', '--depth', '1', repo, projectDir], process.cwd());
  }
  if (!hasProject(projectDir)) throw new Error(`cloned directory does not contain an aidigest project: ${projectDir}`);
  console.log(`aidigest: installing from ${repo ?? 'local repository'}`);
  run('npm', ['ci'], projectDir);
  run('npm', ['run', 'build'], projectDir);
  const cli = join(projectDir, 'dist', 'cli.js');
  const setupArgs = [cli, 'setup', '--mode', options.mode, '--yes'];
  if (repo) setupArgs.push('--repo', repo);
  if (!options.systemProxy) setupArgs.push('--no-system-proxy');
  run(process.execPath, setupArgs, projectDir);
  console.log('aidigest: automatic onboarding complete. New agent processes will use the local digest proxy.');
} catch (error) {
  console.error('aidigest installer error:', error.message);
  process.exit(1);
}

