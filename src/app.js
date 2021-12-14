const { verifyGitVersion, execGitCommand, getSSHCommand, setUsernameAndEmail,
  tryDelete, turnSshAgentUp, killSshAgent, isWin } = require("./helpers");

const parsers = require('./parsers');
const GitKey = require('./git-key');

async function cloneUsingSsh(action, settings) {
  // verify git version
  await verifyGitVersion();
  // get parameters from action and settings
  const path = parsers.path(action.params.path);
  var repo = parsers.string(action.params.repo);
  const branch = parsers.string(action.params.branch);
  const { overwrite, sshKey, extraArgs, saveCreds, username, password } = action.params;
  if (!path || !repo) throw "One of the required parameters was not provided";
  const privateKey = sshKey || settings.sshKey;
  // delete directory if already exists
  if (overwrite) await tryDelete(path);
  // parse args
  let gitKey = null;
  if (username && password) {
    if (!repo.startsWith("https://")){
      throw "Can only use username and password authentication for repository URLs in HTTPS format."
    }
    repo = repo.slice(0, 8) + `${username}:${password}@` + repo.slice(8);
  }
  const args = ["clone", repo];

  if (branch) args.push('-b', branch);

  if (privateKey && !(username && password)) { // if provided ssh Key and not username and password
    const [newGitKey, sshCmd] = await getSSHCommand(privateKey, saveCreds);
    gitKey = newGitKey;
    args.push(`--config core.sshCommand="${sshCmd}"`);
  }

  if (extraArgs) args.push(...parsers.array(extraArgs));
  args.push(path);

  // clone using key file
  let didTurnAgentUp = false;
  try {
    if (gitKey) didTurnAgentUp = await turnSshAgentUp(gitKey);
    // run clone
    const cloneResult = await execGitCommand(args);
    return cloneResult;
  }
  catch (err) { throw err; }
  finally {
    if (didTurnAgentUp) await killSshAgent();
    if (privateKey && gitKey) {
      try { await gitKey.dispose(); }
      catch (err) {}
    }
  }
}

async function pull(action) {
  const path = parsers.path(action.params.path);
  const { force, commitMerge, extraArgs } = action.params;
  if (!path) throw "Must provide repository path";
  const didTurnAgentUp = isWin ? false : await turnSshAgentUp(await GitKey.fromRepoFolder(path));
  const args = ["pull"];
  if (force) args.push("-f");
  args.push(`--${commitMerge ? "" : "no-"}commit`);
  args.push(...parsers.array(extraArgs));
  try {
    const result = await execGitCommand(args, path);
    return result;
  }
  catch (err) { throw err; }
  finally {
    if (didTurnAgentUp) await killSshAgent();
  }
}

async function pushTag(action, settings) {
  const path = parsers.path(action.params.path);
  const tagName = parsers.string(action.params.tagName);
  const message = parsers.string(action.params.message);
  const push = !action.params.noPush;
  const username = parsers.string(action.params.username || settings.username);
  const email = parsers.string(action.params.email || settings.email);
  if (!path || !tagName) throw "Didn't provide one of the required parameters";

  await setUsernameAndEmail(username, email, path);
  
  const didTurnAgentUp = push && !isWin ? await turnSshAgentUp(await GitKey.fromRepoFolder(path)) : false;
  const tagArgs = ["tag"];
  if (message) {
    tagArgs.push("-a", tagName, `-m "${message}"`);
  }
  else {
    // light-weight(lw) tag
    tagArgs.push(tagName);
  }
  const results = {};
  try {
    results.tag = await execGitCommand(tagArgs, path);
    if (push) results.push = await execGitCommand(["push origin", tagName], path);
    return results;
  }
  catch (err) { throw { ...results, err }; }
  finally {
    if (didTurnAgentUp) await killSshAgent();
  }
}

async function addCommit(action, settings) {
  const path = parsers.path(action.params.path);
  const commitMessage = parsers.string(action.params.commitMessage);
  const overrideAdd = parsers.array(action.params.override);
  const push = !action.params.noPush;
  const username = parsers.string(action.params.username || settings.username);
  const email = parsers.string(action.params.email || settings.email);
  if (!path || !commitMessage) throw "Didn't provide one of the required parameters";

  await setUsernameAndEmail(username, email, path);

  let didTurnAgentUp = false;
  if (push && !isWin) {
    const gitKey = await GitKey.fromRepoFolder(path);
    if (!gitKey || !gitKey.keyPath) throw "Couldn't load ssh Key!";
    didTurnAgentUp = await turnSshAgentUp(gitKey);
  }
  const addArgs = ["add"], commitArgs = [`commit -a -m "${commitMessage}"`];
  if (overrideAdd.length > 0) addArgs.push(...overrideAdd);
  else addArgs.push("-A");
  const results = {};
  try {
    results.add = await execGitCommand(addArgs, path);
    results.commit = await execGitCommand(commitArgs, path);
    if (push) results.push = await execGitCommand(["push origin"], path);
    return results;
  }
  catch (err) { throw { ...results, err }; }
  finally {
    if (didTurnAgentUp) await killSshAgent();
  }
}

async function remove(action) {
  const path = parsers.path(action.params.path);
  await tryDelete(path);
  return "Success";
}

module.exports = {
  cloneUsingSsh,
  pull,
  pushTag,
  addCommit,
  remove
};