const kaholoPluginLibrary = require("@kaholo/plugin-library");

const {
  verifyGitVersion,
  execGitCommand,
  setUsernameAndEmail,
  resolveClonePath,
} = require("./git-helpers");
const {
  tryDeleteDirectoryRecursively,
} = require("./fs-helpers");
const {
  startSshAgent,
  tryKillSshAgent,
} = require("./ssh-helpers");

const {
  prepareGitArgsForClonePrivateRepository,
  prepareGitArgsForClonePublicRepository,
  validateParamsForPublicClone,
  validateParamsForPrivateClone,
  prepareGitArgsForPull,
  provideSshPrivateKeyPath,
  validateParamsForPushTag,
  prepareGitArgsForPushTag,
  prepareGitArgsForAddCommitAndPush,
} = require("./preparation-functions");
const { execCommand, omitNil } = require("./helpers");

async function clonePrivateRepository(params) {
  const {
    overwrite,
    path,
    repo,
  } = params;

  await verifyGitVersion();
  const { repoUrl } = validateParamsForPrivateClone(params);
  const clonePath = resolveClonePath(path, repo);

  if (overwrite) {
    await tryDeleteDirectoryRecursively(clonePath);
  }

  const gitArgs = prepareGitArgsForClonePrivateRepository({
    ...params,
    repoUrl,
    clonePath,
  });

  try {
    await startSshAgent();
    return await execGitCommand(gitArgs);
  } finally {
    await tryKillSshAgent();
  }
}

async function clonePublic(params) {
  const {
    path,
    repo,
    overwrite,
  } = params;

  await verifyGitVersion();
  validateParamsForPublicClone();
  const clonePath = resolveClonePath(path, repo);

  if (overwrite) {
    await tryDeleteDirectoryRecursively(clonePath);
  }

  const args = prepareGitArgsForClonePublicRepository({
    ...params,
    clonePath,
  });

  return execGitCommand(args);
}

async function pull(params) {
  const { path } = params;

  const args = prepareGitArgsForPull(params);

  try {
    await startSshAgent();
    return await execGitCommand(args, path.absolutePath);
  } finally {
    await tryKillSshAgent();
  }
}

async function tag(params) {
  const {
    path,
    tagName,
    message,
    pushFlag,
    username,
    email,
  } = params;

  validateParamsForPushTag(tagName);
  await setUsernameAndEmail(username, email, path.absolutePath);
  const tagArgs = prepareGitArgsForPushTag(message, tagName);

  const results = {};
  try {
    results.tag = await execGitCommand(tagArgs, path.absolutePath);
    if (pushFlag) {
      results.push = await push({
        repository: path,
        remote: "origin",
      });
    }

    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  }
}

async function commit(params) {
  const {
    path,
    commitMessage,
    username,
    email,
    push: pushFlag,
    overrideAdd,
  } = params;

  await setUsernameAndEmail(username, email, path.absolutePath);
  const { addArgs, commitArgs } = prepareGitArgsForAddCommitAndPush(commitMessage, overrideAdd);

  const results = {};
  try {
    results.add = await execGitCommand(addArgs, path.absolutePath);
    results.commit = await execGitCommand(commitArgs, path.absolutePath);
    if (pushFlag) {
      results.push = await push({
        repository: path,
        remote: "origin",
      });
    }

    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  }
}

async function push(params) {
  const {
    repository,
    extraArgs = [],
    remote = "origin",
    branch,
  } = params;

  const commandArgs = ["push", remote, branch, ...extraArgs];

  try {
    await startSshAgent();
    return await execGitCommand(commandArgs, repository.absolutePath);
  } finally {
    await tryKillSshAgent();
  }
}

async function runGitCommand(params) {
  const {
    sshPrivateKeyPath,
    password,
    command,
    workingDirectory = kaholoPluginLibrary.helpers.analyzePath("./"),
  } = params;

  return execCommand(command, {
    env: omitNil({
      KAHOLO_GIT_PASSWORD: password,
      KAHOLO_GIT_SSH_KEY_PATH: sshPrivateKeyPath,
    }),
    cwd: workingDirectory.absolutePath,
  });
}

module.exports = kaholoPluginLibrary.bootstrap({
  cloneUsingSsh: provideSshPrivateKeyPath({ callback: clonePrivateRepository }),
  clonePublic,
  push: provideSshPrivateKeyPath({ callback: push }),
  pull: provideSshPrivateKeyPath({ callback: pull }),
  tag: provideSshPrivateKeyPath({ callback: tag }),
  commit: provideSshPrivateKeyPath({ callback: commit }),
  runGitCommand: provideSshPrivateKeyPath({ callback: runGitCommand }),
});
