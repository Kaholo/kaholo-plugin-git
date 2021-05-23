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
  let cloneResult;
  try {
    const cloneCmd = `git ${args.join(" ")}`;
    if (!isWin && gitKey){
      // add key to ssh agent
      await execCommand(`eval \`ssh-agent -s\` && ssh-add ${gitKey.keyPath}`);
    }
    
    // run clone
    cloneResult = await execCommand(cloneCmd);
  } 
  catch (err) { throw err; }
  finally {
    if (privateKey){
      try {
        await gitKey.dispose();
      } catch (err2){
        //TODO: handler key deletion failure
      }
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