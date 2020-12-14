const fs = require('fs');
const path = require('path');

class GitKey{

  constructor(keyPath){
    this.keyPath = keyPath;
  }

  /**
   * 
   * @param {*} keyParam 
   * @returns {Promise<GitKey>}
   */
  static async from(keyParam){
    if (!keyParam){
      throw "SSH key must be specified";
    }
    const key = keyParam.replace(/\\n/g,'\n');
    
    // Write private key to file
    const keyFileName = `git-key-${new Date().getTime()}.pem`;
    const keyPath = path.join(__dirname, keyFileName);
    return new Promise((resolve,reject)=>{
      fs.writeFile(keyPath, key,(err)=>{
        if (err) return reject(err);
        
        // Set key file permissions
        fs.chmod(keyPath, '0400', (error) => {
          if(error) return reject(error);
          const gitKey = new GitKey(keyPath)
          resolve(gitKey);
        });
      })
    });
  }

  async dispose(){
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
