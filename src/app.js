const { verifyGitVersion, execCommand, splitByNewLine, getSSHCommand, untildify } = require("./helpers");
const fs = require("fs");
const os = require('os');
const isWin = os.platform()=='win32';
const normalize = require('path').normalize;

async function cloneUsingSsh(action, settings){
  // verify git version
  await verifyGitVersion();
  // get parameters from action and settings
  const {path, overwrite, repo, branch, sshKey, extraArgs} = action.params;
  const privateKey = sshKey || settings.sshKey;
  // delete directory if already exists
  if (overwrite && overwrite !== 'false') tryDelete(normalize(untildify(path)));
  // parse args
  let gitKey = null;
  const args = ["clone", repo];

  if (branch) args.push('-b', branch);

  if (privateKey) { // if provided ssh Key
    const [newGitKey, sshCmd] = await getSSHCommand(privateKey, isWin);
    gitKey = newGitKey;
    args.push(`--config core.sshCommand="${sshCmd}"`);
  }

  if (extraArgs) args.push(...splitByNewLine(extraArgs));
  args.push(path);
  
  // clone using key file
  let cloneResult, agentUp = false;
  try {
    const cloneCmd = `git ${args.join(" ")}`;
    if (!isWin && gitKey){
      // check if ssh agent is down or up
      if (!process.env["SSH_AUTH_SOCK"]) {
        // ssh agent is down so add command to turn it up and save returned env variables
        const sshAgentResult = await execCommand(`ssh-agent`);
        const matchResult = sshAgentResult.matchAll(/(SSH_AUTH_SOCK|SSH_AGENT_PID)=([^;]+);/g);
        process.env["SSH_AUTH_SOCK"] = matchResult.next().value[2];
        process.env["SSH_AGENT_PID"] = matchResult.next().value[2];
        agentUp = true;
      }
      // add key to ssh agent
      await execCommand(`ssh-add ${gitKey.keyPath}`);
    }
    
    // run clone
    cloneResult = await execCommand(cloneCmd);
  } 
  catch (err) { throw err; }
  finally {
    if (agentUp){
      try { await execCommand(`eval \`ssh-agent -k\``); }
      catch (err) {}
    }
    if (privateKey){
      try { await gitKey.dispose();} 
      catch (err){}
    }
  }
  return cloneResult;
}

function tryDelete(path){
  if (!fs.existsSync(path)) return;
  try{
    fs.rmdirSync(path, { recursive: true });
  }
  catch (err){
    throw "couldn't delete existing directory: "
  }
}


module.exports = {
  cloneUsingSsh
};