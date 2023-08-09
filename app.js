const kaholoPluginLibrary = require("@kaholo/plugin-library");

const {
  verifyGitVersion,
  execGitCommand,
  setUsernameAndEmail,
  resolveClonePath,
} = require("./helpers/git-helpers");
const {
  tryDeleteDirectoryRecursively,
} = require("./helpers/fs-helpers");
const {
  startSshAgent,
  tryKillSshAgent,
} = require("./helpers/ssh-helpers");

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
    return execGitCommand(args, path);
  } finally {
    await tryKillSshAgent();
  }
}

async function pushTag(params) {
  const {
    path,
    tagName,
    message,
    push,
    username,
    email,
  } = params;

  validateParamsForPushTag(tagName);
  await setUsernameAndEmail(username, email, path);
  const tagArgs = prepareGitArgsForPushTag(message, tagName);

  const results = {};
  try {
    results.tag = await execGitCommand(tagArgs, path);
    if (push) {
      await startSshAgent();
      results.push = await execGitCommand(["push origin", tagName], path);
    }
    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  } finally {
    await tryKillSshAgent();
  }
}

async function addCommitAndPush(params) {
  const {
    path,
    commitMessage,
    username,
    email,
    push,
    overrideAdd,
  } = params;

  await setUsernameAndEmail(username, email, path);
  const { addArgs, commitArgs } = prepareGitArgsForAddCommitAndPush(commitMessage, overrideAdd);

  const results = {};
  try {
    results.add = await execGitCommand(addArgs, path);
    results.commit = await execGitCommand(commitArgs, path);
    if (push) {
      await startSshAgent();
      results.push = await execGitCommand(["push origin"], path);
    }
    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  } finally {
    await tryKillSshAgent();
  }
}

async function remove(params) {
  const { path } = params;

  await tryDeleteDirectoryRecursively(path);
  return "Success";
}

module.exports = kaholoPluginLibrary.bootstrap({
  cloneUsingSsh: provideSshPrivateKeyPath({ callback: clonePrivateRepository }),
  addCommit: provideSshPrivateKeyPath({ callback: addCommitAndPush }),
  clonePublic,
  pull: provideSshPrivateKeyPath({ callback: pull }),
  pushTag: provideSshPrivateKeyPath({ callback: pushTag }),
  remove,
});
