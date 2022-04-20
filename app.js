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

const parsers = require("./parsers");
const GitKey = require("./git-key");

async function cloneUsingSsh(action, settings) {
  // verify git version
  await verifyGitVersion();
  // get parameters from action and settings
  const path = parsers.path(action.params.path);
  let repo = parsers.string(action.params.repo);
  const branch = parsers.string(action.params.branch);
  const {
    overwrite, sshKey, extraArgs, saveCreds, username, password,
  } = action.params;
  const privateKey = sshKey || settings.sshKey;

  // validate parameters
  if (repo.startsWith("https://")) {
    if (!username || !password) {
      throw new Error("Both username and password are requried parameters for private repository URLs in HTTPS format.");
    }
    repo = `${repo.slice(0, 8)}${username}:${password}@${repo.slice(8)}`;
  } else {
    if (username || password) {
      console.error("Parameters Username and Password are needed only for repository URLs in HTTPS format.");
    }
    if (!privateKey) {
      throw new Error("SSH key is required for repository URLs NOT in HTTPS format.");
    }
  }

  // delete directory if already exists
  if (overwrite) {
    await tryDelete(path);
  }
  let gitKey = null;

  const args = ["clone", repo];

  if (branch) {
    args.push("-b", branch);
  }

  if (privateKey && !(username && password)) { // if provided ssh Key and not username and password
    const [newGitKey, sshCmd] = await getSSHCommand(privateKey, saveCreds);
    gitKey = newGitKey;
    args.push("--config");
    args.push(`core.sshCommand="${sshCmd}"`);
  }

  if (extraArgs) {
    args.push(...parsers.array(extraArgs));
  }
  args.push(path);

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
    if (privateKey && gitKey) {
      await gitKey.dispose();
    }
  }
}

async function clonePublic(action) {
  await verifyGitVersion();
  const path = parsers.path(action.params.path);
  const repo = parsers.string(action.params.repo);
  const branch = parsers.string(action.params.branch);
  const { overwrite, extraArgs } = action.params;

  if (!repo.startsWith("https://")) {
    throw new Error("Please use HTTPS format URL for public repositories. Anonymous SSH is not supported in method \"Clone public repository\".");
  }

  if (overwrite) {
    await tryDelete(path);
  }

  const args = ["clone", repo];

  if (branch) {
    args.push("-b", branch);
  }

  if (extraArgs) {
    args.push(...parsers.array(extraArgs));
  }
  args.push(path);

  return execGitCommand(args);
}

async function pull(action) {
  const path = parsers.path(action.params.path);
  const { force, commitMerge, extraArgs } = action.params;
  if (!path) {
    throw new Error("Repository Path is a requried parameter.");
  }
  const didTurnAgentUp = isWin ? false : await turnSshAgentUp(await GitKey.fromRepoFolder(path));
  const args = ["pull"];
  if (force) {
    args.push("-f");
  }
  args.push(`--${commitMerge ? "" : "no-"}commit`);
  args.push(...parsers.array(extraArgs));
  try {
    return execGitCommand(args, path);
  } finally {
    if (didTurnAgentUp) {
      await killSshAgent();
    }
  }
}

async function pushTag(action, settings) {
  const path = parsers.path(action.params.path);
  const tagName = parsers.string(action.params.tagName);
  const message = parsers.string(action.params.message);
  const push = !action.params.noPush;
  const username = parsers.string(action.params.username || settings.username);
  const email = parsers.string(action.params.email || settings.email);

  let didTurnAgentUp = false;

  if (!path || !tagName) {
    throw new Error("Both Repository Path and Tag Name are required parameters.");
  }

  if (tagName.indexOf(" ") >= 0) {
    throw new Error("Tag name cannot have spaces and should be a version number such as \"v2.1.0\".");
  }

  await setUsernameAndEmail(username, email, path);

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

async function addCommit(action, settings) {
  const path = parsers.path(action.params.path);
  const commitMessage = parsers.string(action.params.commitMessage);
  const overrideAdd = parsers.array(action.params.override);
  const push = !action.params.noPush;
  const username = parsers.string(action.params.username || settings.username);
  const email = parsers.string(action.params.email || settings.email);
  if (!path || !commitMessage) {
    throw new Error("Both Repository Path and Commit Message are required parameters.");
  }

  await setUsernameAndEmail(username, email, path);

  let didTurnAgentUp = false;
  if (push && !isWin) {
    const gitKey = await GitKey.fromRepoFolder(path);
    if (!gitKey || !gitKey.keyPath) {
      throw new Error("Couldn't load ssh Key!");
    }
    didTurnAgentUp = await turnSshAgentUp(gitKey);
  }
  const addArgs = ["add"]; const
    commitArgs = [`commit -a -m "${commitMessage}"`];
  if (overrideAdd.length > 0) {
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

async function remove(action) {
  const path = parsers.path(action.params.path);
  await tryDelete(path);
  return "Success";
}

module.exports = {
  cloneUsingSsh,
  clonePublic,
  pull,
  pushTag,
  addCommit,
  remove,
};
