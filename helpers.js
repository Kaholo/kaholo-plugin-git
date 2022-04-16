const os = require("os");
const childProcess = require("child_process");
const fs = require("fs");
const { normalize } = require("path");
const compareVersion = require("compare-versions");
const GitKey = require("./git-key");

const homeDirectory = os.homedir();
const isWin = os.platform() === "win32";

async function verifyGitVersion() {
  const minimalGitRequired = "2.10.0";
  let gitVersion;

  try {
    const gitResult = await execCommand("git --version");
    const gitVerNumArray = gitResult.split(" ")[2].trim().split(".");
    gitVersion = gitVerNumArray.slice(0, 3).join(".");
  } catch (err) {
    throw new Error(`Could not determine git version. error: ${err}`);
  }

  const isValidGitVersion = compareVersion.compare(gitVersion, minimalGitRequired, ">=");
  if (!isValidGitVersion) {
    throw new Error(`Git version must be ${minimalGitRequired} or higher, got ${gitVersion}`);
  }
}

async function execCommand(command, opts = {}) {
  let newopts = {};
  newopts = opts;
  if (!newopts.env) {
    newopts.env = process.env;
  }
  return new Promise((resolve, reject) => {
    childProcess.exec(command, newopts, (error, stdout, stderr) => {
      if (error) {
        console.log(`${stdout}`);
        return reject(error);
      }
      let newstdout = stdout;
      if (stderr && !newstdout) {
        newstdout = `${stderr}\nSuccess!`;
      }
      return resolve(newstdout);
    });
  });
}

async function execGitCommand(args, path) {
  const opts = path ? { cwd: path } : {};
  return execCommand(`git ${args.join(" ")}`, opts);
}

async function getSSHCommand(privateKey, saveCreds) {
  const gitKey = await GitKey.from(privateKey, saveCreds);
  const keyPathParam = isWin ? gitKey.keyPath.replace(/\\/g, "\\\\") : gitKey.keyPath;
  return [gitKey, `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${keyPathParam}`];
}

function untildify(path) {
  return homeDirectory ? path.replace(/^~(?=$|\/|\\)/, homeDirectory) : path;
}

async function tryDelete(path) {
  const newpath = normalize(untildify(path));
  if (!fs.existsSync(newpath)) {
    return false;
  }
  try {
    const gitKey = await GitKey.fromRepoFolder(newpath);
    if (gitKey) {
      await gitKey.dispose();
    }
  } catch (err) {
    // no problem
  }
  try {
    fs.rmdirSync(newpath, { recursive: true });
  } catch (err) {
    // no problem
  }
  return true;
}

async function turnSshAgentUp(gitKey) {
  if (isWin || !gitKey || !gitKey.keyPath) {
    return false;
  }
  // check if ssh agent is down or up
  let didTurnAgentUp = false;
  if (!process.env.SSH_AUTH_SOCK) {
    // ssh agent is down so add command to turn it up and save returned env variables
    const sshAgentResult = await execCommand("ssh-agent");
    // remove newlines and split using both ';' and '='
    const sshAgentResArray = sshAgentResult.replace(/\r?\n|\r/g, "").split(/;|=/);
    [, process.env.SSH_AUTH_SOCK, , , process.env.SSH_AGENT_PID] = sshAgentResArray;
    didTurnAgentUp = true;
  }
  // add key to ssh agent
  await execCommand(`ssh-add ${gitKey.keyPath}`);
  return didTurnAgentUp;
}

async function killSshAgent() {
  await execCommand("eval `ssh-agent -k`");
}

async function setUsernameAndEmail(username, email, path) {
  if (username) {
    await execGitCommand([`config user.name "${username}"`], path);
  }
  if (email) {
    await execGitCommand([`config user.email "${email}"`], path);
  }
}

module.exports = {
  verifyGitVersion,
  execCommand,
  getSSHCommand,
  untildify,
  tryDelete,
  turnSshAgentUp,
  killSshAgent,
  execGitCommand,
  setUsernameAndEmail,
  isWin,
};
