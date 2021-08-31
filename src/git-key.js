const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GitKey{

  constructor(keyPath, saveCreds){
    this.keyPath = keyPath;
    this.saveCreds = saveCreds;
  }

  /**
   * 
   * @param {*} keyParam 
   * @returns {Promise<GitKey>}
   */
  static async from(keyParam, saveCreds){
    if (!keyParam){
      throw "SSH key must be specified";
    }
    const key = keyParam.replace(/\\n/g,'\n');
    
    // Write private key to file
    const keyFileName = `git-key-${uuidv4()}.pem`;
    const keyPath = path.join(__dirname, keyFileName);
    return new Promise((resolve,reject)=>{
      fs.writeFile(keyPath, key,(err)=>{
        if (err) return reject(err);
        
        // Set key file permissions
        fs.chmod(keyPath, '0400', (error) => {
          if(error) return reject(error);
          const gitKey = new GitKey(keyPath, saveCreds)
          resolve(gitKey);
        });
      })
    });
  }

  
  /**
   * 
   * @param {string} path 
   * @returns {Promise<GitKey | null>}
   */
   static async fromRepoFolder(path){
    const {execGitCommand} = require('./helpers');
    if (!path){
      throw "Must provide repository path";
    }
    try {
      const sshCommand = await execGitCommand(["config --get core.sshCommand"], path);
      const keyPath = sshCommand.match(/-i ([^\n\r]+)/)[1].replace(/\\\\/g, "\\");
      if (!keyPath) return null;
      return new GitKey(keyPath);
    }
    catch (err) {
      console.error(err);
      throw err;
      return null;
    }
  }

  async dispose(){
    if (this.saveCreds) return;
    const self = this;
    return new Promise((resolve,reject)=>{
      fs.unlink(self.keyPath,(err)=>{
        if (err) return reject(err);
        resolve();
      })
    })
  }
}

module.exports = GitKey;
