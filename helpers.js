const os = require('os');
const child_process = require("child_process");
const GitKey = require('./git-key');
const fs = require("fs");
const compareVersion = require('./compare-versions');
const homeDirectory = os.homedir();
const isWin = os.platform()=='win32';

const normalize = require('path').normalize;

async function verifyGitVersion(){
    const minimalGitRequired = '2.10.0';
    let gitVersion;
    
    try {
      const gitResult = await execCommand('git --version');
      gitVersion = gitResult.replace('git version ','').split(' ')[0].trim().split('.windows')[0];
    } catch(err){
      throw `Could not determine git version. error: ${err}`;
    }
    
    const isValidGitVersion = compareVersion.compare(gitVersion,minimalGitRequired,'>=');
    if (!isValidGitVersion){
      throw `Git version must be ${minimalGitRequired} or higher, got ${gitVersion}`;
    }
}

async function execCommand(command, opts = {}){
    if (!opts.env) opts.env = process.env;
    return new Promise((resolve,reject) => {
        child_process.exec(command, opts, (error, stdout, stderr) => {
            if (error) {
               console.log(`${stdout}`)
               return reject(error);
            }
            if (stderr && !stdout){
              stdout = `${stderr}\nSuccess!`;
            }
            return resolve(stdout);
        });
    })
}

async function execGitCommand(args, path){
  const opts = path ? {cwd: path} : {};
  return execCommand(`git ${args.join(" ")}`, opts)
}

async function getSSHCommand(privateKey, saveCreds){
    const gitKey = await GitKey.from(privateKey, saveCreds);
    const keyPathParam = isWin ? gitKey.keyPath.replace(/\\/g,'\\\\') : gitKey.keyPath;
    return [gitKey, `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${keyPathParam}`];
}

function untildify(path){
    return homeDirectory ? path.replace(/^~(?=$|\/|\\)/, homeDirectory) : path;
}

async function tryDelete(path){
  path = normalize(untildify(path));
  if (!fs.existsSync(path)) return false;
  try{
    const gitKey = await GitKey.fromRepoFolder(path);
    if (gitKey) await gitKey.dispose();
  }
  catch (err){}
  finally{
    try {
      fs.rmdirSync(path, { recursive: true });
    } catch (err) { throw `Couldn't delete the repository: ${path}`}
  }
  return true;
}  

async function turnSshAgentUp(gitKey){
  if (isWin || !gitKey || !gitKey.keyPath) return;
  // check if ssh agent is down or up
  let didTurnAgentUp = false;
  if (!process.env["SSH_AUTH_SOCK"]) {
      // ssh agent is down so add command to turn it up and save returned env variables
      const sshAgentResult = await execCommand(`ssh-agent`);
      const matchResult = sshAgentResult.matchAll(/(SSH_AUTH_SOCK|SSH_AGENT_PID)=([^;]+);/g);
      process.env["SSH_AUTH_SOCK"] = matchResult.next().value[2];
      process.env["SSH_AGENT_PID"] = matchResult.next().value[2];
      didTurnAgentUp = true;
  }
  // add key to ssh agent
  await execCommand(`ssh-add ${gitKey.keyPath}`);
  return didTurnAgentUp;
}

async function killSshAgent(){
  try { await execCommand(`eval \`ssh-agent -k\``); }
  catch (err) {}
}

async function setUsernameAndEmail(username, email, path){
  if (username) await execGitCommand([`config user.name "${username}"`], path);
  if (email) await execGitCommand([`config user.email "${email}"`], path);
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
  isWin
};