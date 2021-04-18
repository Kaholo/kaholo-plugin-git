const child_process = require("child_process");
const compareVersion = require('./compare-versions');
const GitKey = require('./git-key');

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
    return new Promise((resolve,reject) => {
        child_process.exec(command, opts, (error, stdout, stderr) => {
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

async function getSSHCommand(privateKey, isWin){
    const gitKey = await GitKey.from(privateKey);
    const keyPathParam = isWin ? gitKey.keyPath.replace(/\\/g,'\\\\') : gitKey.keyPath;
    return [gitKey, `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${keyPathParam}`];
}

function splitByNewLine(text){
    return text.split("\n").map(line => line.trim()).filter(line => line);
}  

module.exports = {
    verifyGitVersion,
    execCommand,
    splitByNewLine,
    getSSHCommand
};