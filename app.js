const kaholoPluginLibrary = require("@kaholo/plugin-library");
const {
  basename,
  resolve: resolvePath,
} = require("path");

const GitKey = require("./git-key");
const {
  verifyGitVersion,
  execGitCommand,
  getSSHCommand,
  setUsernameAndEmail,
  tryDelete,
  turnSshAgentUp,
  killSshAgent,
  isWin,
} = require("./helpers");

async function cloneUsingSsh(params) {
  await verifyGitVersion();

  const {
    path,
    repo,
    branch,
    overwrite,
    sshKey,
    extraArgs,
    saveCreds,
    username,
    password,
  } = params;

  // validate parameters
  let validRepoUrl = repo;
  if (repo.startsWith("https://")) {
    if (!username || !password) {
      throw new Error("Both username and password are required parameters for private repository URLs in HTTPS format.");
    }
    validRepoUrl = `https://${username}:${password}@${repo.slice(8)}`;
  } else {
    if (username || password) {
      console.error("Parameters Username and Password are needed only for repository URLs in HTTPS format.");
    }
    if (!sshKey) {
      throw new Error("SSH key is required for repository URLs NOT in HTTPS format.");
    }
  }

  const repoDirectoryName = path ? basename(path) : basename(repo).replace(/\.git$/, "");
  const resolvedPath = resolvePath(path ?? repoDirectoryName);

  // delete directory if already exists
  if (overwrite) {
    await tryDelete(resolvedPath);
  }

  const args = ["clone", validRepoUrl];
  if (branch) {
    args.push("-b", branch);
  }

  let gitKey = null;
  if (sshKey && !(username && password)) { // if provided ssh Key and not username and password
    const [newGitKey, sshCmd] = await getSSHCommand(sshKey, saveCreds);
    gitKey = newGitKey;
    args.push("--config");
    args.push(`core.sshCommand="${sshCmd}"`);
  }
  if (extraArgs) {
    args.push(...extraArgs);
  }
  args.push(resolvedPath);

  // clone using key file
  let didTurnAgentUp = false;
  try {
    if (gitKey) {
      didTurnAgentUp = await turnSshAgentUp(gitKey);
    }
    // run clone
    const cloneResult = await execGitCommand(args);
    return cloneResult;
  } finally {
    if (didTurnAgentUp) {
      await killSshAgent();
    }
    if (sshKey && gitKey) {
      await gitKey.dispose();
    }
  }
}

async function clonePublic(params) {
  await verifyGitVersion();

  const {
    path,
    repo,
    branch,
    overwrite,
    extraArgs,
  } = params;

  const repoDirectoryName = path ? basename(path) : basename(repo).replace(/\.git$/, "");
  const resolvedPath = resolvePath(path ?? repoDirectoryName);

  if (!repo.startsWith("https://")) {
    throw new Error("Please use HTTPS format URL for public repositories. Anonymous SSH is not supported in method \"Clone public repository\".");
  }

  if (overwrite) {
    await tryDelete(resolvedPath);
  }

  const args = ["clone", repo];
  if (branch) {
    args.push("-b", branch);
  }
  if (extraArgs) {
    args.push(...extraArgs);
  }
  args.push(resolvedPath);

  return execGitCommand(args);
}

async function pull(params) {
  const {
    path,
    force,
    commitMerge,
    extraArgs,
  } = params;

  const didTurnAgentUp = isWin ? false : await turnSshAgentUp(await GitKey.fromRepoFolder(path));

  const args = ["pull"];
  if (force) {
    args.push("-f");
  }
  args.push(`--${commitMerge ? "" : "no-"}commit`);
  args.push(...extraArgs);

  try {
    return execGitCommand(args, path);
  } finally {
    if (didTurnAgentUp) {
      await killSshAgent();
    }
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

  if (/\s/g.test(tagName)) {
    throw new Error("Tag name cannot have spaces and should be a version number such as \"v2.1.0\".");
  }

  await setUsernameAndEmail(username, email, path);

  let didTurnAgentUp = false;
  if (push && !isWin) {
    didTurnAgentUp = await turnSshAgentUp(await GitKey.fromRepoFolder(path));
  }

  const tagArgs = ["tag"];
  if (message) {
    tagArgs.push("-a", tagName, "-m", `"${message}"`);
  } else {
    // light-weight(lw) tag
    tagArgs.push(tagName);
  }

  const results = {};
  try {
    results.tag = await execGitCommand(tagArgs, path);
    if (push) {
      results.push = await execGitCommand(["push origin", tagName], path);
    }
    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  } finally {
    if (didTurnAgentUp) {
      await killSshAgent();
    }
  }
}

async function addCommit(params) {
  const {
    path,
    commitMessage,
    username,
    email,
    push,
    overrideAdd,
  } = params;

  await setUsernameAndEmail(username, email, path);

  let didTurnAgentUp = false;
  if (push && !isWin) {
    const gitKey = await GitKey.fromRepoFolder(path);
    if (!gitKey || !gitKey.keyPath) {
      throw new Error("Couldn't load ssh Key!");
    }
    didTurnAgentUp = await turnSshAgentUp(gitKey);
  }

  const addArgs = ["add"];
  const commitArgs = [`commit -a -m "${commitMessage}"`];
  if (overrideAdd?.length > 0) {
    addArgs.push(...overrideAdd);
  } else {
    addArgs.push("-A");
  }

  const results = {};
  try {
    results.add = await execGitCommand(addArgs, path);
    results.commit = await execGitCommand(commitArgs, path);
    if (push) {
      results.push = await execGitCommand(["push origin"], path);
    }
    return results;
  } catch (err) {
    throw new Error(`results: ${JSON.stringify(results)}, error: ${err}`);
  } finally {
    if (didTurnAgentUp) {
      await killSshAgent();
    }
  }
}

async function remove(params) {
  const { path } = params;

  await tryDelete(path);
  return "Success";
}

module.exports = kaholoPluginLibrary.bootstrap({
  cloneUsingSsh,
  clonePublic,
  pull,
  pushTag,
  addCommit,
  remove,
});
