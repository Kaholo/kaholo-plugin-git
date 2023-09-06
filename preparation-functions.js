const fs = require("fs-extra");
const kaholoPluginLibrary = require("@kaholo/plugin-library");

const { execGitCommand } = require("./git-helpers");
const { shredFile } = require("./fs-helpers");

/**
 * This function intercepts the SSH Key from passed params
 * writes the key to the temporary file, sets
 * a proper SSH command for Git usage, and runs a
 * callback function. After running the callback,
 * it cleans up: shreds the SSH Key file on the disk,
 * and restores the initial core.sshComand config in Git
 */
function provideSshPrivateKeyPath(options) {
  const {
    sourceKeyName = "sshKey",
    targetKeyName = "sshPrivateKeyPath",
    setGlobalSshCommand = true,
    cwdKeyName = "path",
    callback,
  } = options;

  const useGlobalSshCommand = setGlobalSshCommand && cwdKeyName;
  let originalSshCommand;

  return async (params) => {
    if (!params[sourceKeyName]) {
      return callback(params);
    }

    let parsedSshKey = params[sourceKeyName].replace(/\\n/g, "\n");
    if (!parsedSshKey.endsWith("\n")) {
      parsedSshKey += "\n";
    }

    if (useGlobalSshCommand) {
      originalSshCommand = await execGitCommand(["config", "--global", "--get", "core.sshCommand"]).catch(() => {}); // ignore errors
      originalSshCommand = originalSshCommand?.trim();
    }

    // We need better API in kaholo-plugin-library for these kind of operations
    // with temporary files, currently this is the solution I came up with
    // using temporaryFileSentinel, which is specifically designed for creating
    // temporary files and safely deleting them after callback is finished
    let result;
    let error;
    await kaholoPluginLibrary.helpers.temporaryFileSentinel(
      [parsedSshKey],
      async (sshPrivateKeyPath) => {
        await fs.chmod(sshPrivateKeyPath, "0400");
        if (useGlobalSshCommand) {
          const sshComand = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${sshPrivateKeyPath}`;
          await execGitCommand(["config", "--global", "core.sshCommand", JSON.stringify(sshComand)]);
        }

        return callback({
          ...params,
          [targetKeyName]: sshPrivateKeyPath,
        })
          .then((res) => {
            result = res;
          })
          .catch((err) => {
            error = err;
          })
          .finally(() => shredFile(sshPrivateKeyPath));
      },
    );

    if (originalSshCommand) {
      await execGitCommand(["config", "--global", "core.sshCommand", JSON.stringify(originalSshCommand)]);
    } else if (useGlobalSshCommand) {
      await execGitCommand(["config", "--global", "--unset", "core.sshCommand"]);
    }

    if (error) {
      throw error;
    }
    return result;
  };
}

function prepareGitArgsForClonePrivateRepository(params) {
  const {
    branch,
    extraArgs,
    clonePath,
    repoUrl,
  } = params;

  const args = ["clone", "--progress", repoUrl];
  if (branch) {
    args.push("-b", branch);
  }
  if (extraArgs) {
    args.push(...extraArgs);
  }
  args.push(clonePath);

  return args;
}

function prepareGitArgsForClonePublicRepository(params) {
  const {
    branch,
    extraArgs,
    clonePath,
    repo,
  } = params;

  const args = ["clone", "--progress", repo];
  if (branch) {
    args.push("-b", branch);
  }
  if (extraArgs) {
    args.push(...extraArgs);
  }
  args.push(clonePath);

  return args;
}

function validateParamsForPrivateClone(params) {
  const {
    repo,
    username,
    password,
    sshKey,
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

  return {
    repoUrl: validRepoUrl,
  };
}

function validateParamsForPublicClone(params) {
  const { repo } = params;

  if (!repo.startsWith("https://")) {
    throw new Error("Please use HTTPS format URL for public repositories. Anonymous SSH is not supported in method \"Clone public repository\".");
  }
}

function prepareGitArgsForPull(params) {
  const {
    force,
    commitMerge,
    extraArgs,
  } = params;

  const args = ["pull"];
  if (force) {
    args.push("-f");
  }
  args.push(`--${commitMerge ? "" : "no-"}commit`);
  args.push(...extraArgs);

  return args;
}

function validateParamsForPushTag(tagName) {
  if (/\s/g.test(tagName)) {
    throw new Error("Tag name cannot have spaces and should be a version number such as \"v2.1.0\".");
  }
}

function prepareGitArgsForPushTag(message, tagName) {
  const tagArgs = ["tag"];
  if (message) {
    tagArgs.push("-a", tagName, "-m", `"${message}"`);
  } else {
    // light-weight(lw) tag
    tagArgs.push(tagName);
  }
  return tagArgs;
}

function prepareGitArgsForAddCommitAndPush(commitMessage, overrideAdd) {
  const addArgs = ["add"];
  const commitArgs = ["commit", "-a", "-m", JSON.stringify(commitMessage)];
  if (overrideAdd?.length > 0) {
    addArgs.push(...overrideAdd);
  } else {
    addArgs.push("-A");
  }
  return { addArgs, commitArgs };
}

module.exports = {
  validateParamsForPrivateClone,
  validateParamsForPublicClone,
  prepareGitArgsForClonePrivateRepository,
  prepareGitArgsForClonePublicRepository,
  prepareGitArgsForPull,
  validateParamsForPushTag,
  prepareGitArgsForPushTag,
  prepareGitArgsForAddCommitAndPush,
  provideSshPrivateKeyPath,
};
