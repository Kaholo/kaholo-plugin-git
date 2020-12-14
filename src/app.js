const child_process = require("child_process");
const compareVersion = require('./compare-versions');
const GitKey = require('./git-key');

async function verifyGitVersion(){
  const minimalGitRequired = '2.10.0';
  let gitVersion;
  
  try {
    const gitResult = await execCommand('git --version');
    gitVersion = gitResult.replace('git version ','').split(' ')[0].trim();
  } catch(err){
    throw `Could not determine git version. error: ${err}`;
  }
  
  const isValidGitVersion = compareVersion.compare(gitVersion,minimalGitRequired,'>=');
  if (!isValidGitVersion){
    throw `Git version must be ${minimalGitRequired} or higher, got ${gitVersion}`;
  }
}

async function execCommand(command){
  return new Promise((resolve,reject) => {
		child_process.exec(command, (error, stdout, stderr) => {
			if (error) {
				console.log(`${stdout}`)
			   return reject(error);
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
			}
			return resolve(stdout);
		});
	})
}

async function cloneUsingSsh(action, settings){
  
  await verifyGitVersion();
  
  // return action.params;
  const repo = action.params.repo;
  const clonePath = action.params.path;
  const privateKey = action.params.sshKey || settings.sshKey;
  
  const gitKey = await GitKey.from(privateKey);

  // clone using key file
  const sshCommand = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${gitKey.keyPath}`
  const cloneCmd = `git clone ${repo} --config core.sshCommand="${sshCommand}" ${clonePath}`
  
  // add key to ssh agent
  await execCommand(`eval \`ssh-agent -s\` && ssh-add ${gitKey.keyPath}`);
  
  // run clone
  const cloneResult = await execCommand(cloneCmd);

  try {
    await gitKey.dispose();
  } catch (err){
    //TODO: handler key deletion failure
  }

  return cloneResult;
}


module.exports = {
  cloneUsingSsh: cloneUsingSsh
};
