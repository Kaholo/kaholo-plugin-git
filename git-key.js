const fs = require("fs");
const pathmodule = require("path");
const { v4: uuidv4 } = require("uuid");

class GitKey {
  constructor(keyPath, saveCreds) {
    this.keyPath = keyPath;
    this.saveCreds = saveCreds;
  }

  /**
   *
   * @param {*} keyParam
   * @returns {Promise<GitKey>}
   */
  static async from(keyParam, saveCreds) {
    if (!keyParam) {
      throw new Error("SSH key must be specified.");
    }
    let key = keyParam.replace(/\\n/g, "\n");
    if (!key.endsWith("\n")) { key += "\n"; }

    // Write private key to file
    const keyFileName = `git-key-${uuidv4()}.pem`;
    const keyPath = pathmodule.join(__dirname, keyFileName);
    return new Promise((resolve, reject) => {
      fs.writeFile(keyPath, key, (err) => {
        if (err) { return reject(err); }
        // Set key file permissions
        fs.chmod(keyPath, "0400", (error) => {
          if (error) { return reject(error); }
          const gitKey = new GitKey(keyPath, saveCreds);
          resolve(gitKey);
          return null;
        });
        return null;
      });
    });
  }

  /**
   *
   * @param {string} path
   * @returns {Promise<GitKey | null>}
   */
  static async fromRepoFolder(path) {
    // require here and not in top of file to not make circular dependencies
    const { execGitCommand } = require("./helpers"); // eslint-disable-line global-require
    if (!path) {
      throw new Error("Must provide repository path.");
    }
    try {
      const sshCommand = await execGitCommand(["config --get core.sshCommand"], path);
      if (!sshCommand) { return undefined; }
      const matches = sshCommand.match(/-i ([^\n\r]+)/);
      if (!matches) { return undefined; }
      const keyPath = matches[1].replace(/\\\\/g, "\\");
      if (!keyPath) { return undefined; }
      return new GitKey(keyPath);
    } catch (err) {
      return undefined;
    }
  }

  async dispose() {
    if (this.saveCreds) { return Promise.resolve(); }
    const self = this;
    return new Promise((resolve, reject) => {
      fs.unlink(self.keyPath, (err) => {
        if (err) { return reject(err); }
        return resolve();
      });
    });
  }
}

module.exports = GitKey;
