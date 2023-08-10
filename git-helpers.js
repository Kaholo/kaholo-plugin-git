const compareVersions = require("compare-versions");
const path = require("path");

const { execCommand } = require("./helpers");

const MINIMAL_GIT_VERSION_REQUIRED = "2.10.0";

async function verifyGitVersion() {
  let gitVersion;

  try {
    const gitResult = await execCommand("git --version");
    const gitVerNumArray = gitResult.split(" ")[2].trim().split(".");
    gitVersion = gitVerNumArray.slice(0, 3).join(".");
  } catch (err) {
    throw new Error(`Could not determine git version. error: ${err}`);
  }

  const isValidGitVersion = compareVersions.compare(gitVersion, MINIMAL_GIT_VERSION_REQUIRED, ">=");
  if (!isValidGitVersion) {
    throw new Error(`Git version must be ${MINIMAL_GIT_VERSION_REQUIRED} or higher, got ${gitVersion}`);
  }
}

async function execGitCommand(args, cwd) {
  const opts = cwd ? { cwd } : {};

  return execCommand(`git ${args.join(" ")}`, opts);
}

async function setUsernameAndEmail(username, email, gitPath) {
  if (username) {
    await execGitCommand(["config", "user.name", username], gitPath);
  }
  if (email) {
    await execGitCommand(["config", "user.email", email], gitPath);
  }
}

function resolveClonePath(rawPath, repo) {
  const repoDirectoryName = path.basename(rawPath || repo.replace(/\.git$/, ""));
  const resolvedPath = path.resolve(rawPath ?? repoDirectoryName);

  return resolvedPath;
}

module.exports = {
  setUsernameAndEmail,
  execGitCommand,
  verifyGitVersion,
  resolveClonePath,
};
