const { verifyGitVersion, execCommand, splitByNewLine, getSSHCommand } = require("./helpers");
const fs = require("fs");
const os = require('os');
const isWin = os.platform()=='win32';
const homeDir = os.homedir();
const path = require('path');

async function cloneUsingSsh(action, settings){
  // delete directory if already exists
  const clonePath = (action.params.path).trim().replace("~", homeDir);
  if (fs.existsSync(clonePath)){
    try{
      fs.rmdirSync(clonePath, { recursive: true });
    }
    catch (err){
      throw "couldn't delete existing directory: "
    }
  }
  await verifyGitVersion();
  
  // return action.params;
  const repo = (action.params.repo).trim();
  
  
  let gitKey = null;
  const args = ["clone", repo];
  const privateKey = (action.params.sshKey || settings.sshKey || "").trim();
  if (privateKey) { // if provided ssh Key
    const sshRes = await getSSHCommand(privateKey, isWin);
    gitKey = sshRes[0];
    args.push(`--config core.sshCommand="${sshRes[1]}"`);
  }
  if (action.params.extraArgs) args.push(...splitByNewLine(action.params.extraArgs));
  args.push(clonePath);
  
  // clone using key file
  try {
    const cloneCmd = `git ${args.join(" ")}`;
  
    if (!isWin && gitKey){
      // add key to ssh agent
      await execCommand(`eval \`ssh-agent -s\` && ssh-add ${gitKey.keyPath}`);
    }
    
    // run clone
    const cloneResult = await execCommand(cloneCmd);
    if (privateKey){
      try {
        await gitKey.dispose();
      } catch (err2){
        //TODO: handler key deletion failure
      }
    }
    return cloneResult;
  } catch (err) {
    if (privateKey){
      try {
        await gitKey.dispose();
      } catch (err2){
        //TODO: handler key deletion failure
      }
    }
    throw err;
  }
}


module.exports = {
  cloneUsingSsh
};