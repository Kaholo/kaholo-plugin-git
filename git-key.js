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
    if (!key.endsWith("\n")) {
      key += "\n";
    }

    // Write private key to file
    const keyFileName = `git-key-${uuidv4()}.pem`;
    const keyPath = pathmodule.join(__dirname, keyFileName);
    await fs.promises.writeFile(keyPath, key);
    await fs.promises.chmod(keyPath, "0400");
    return new GitKey(keyPath, saveCreds);
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
      if (!sshCommand) {
        throw new Error(`Couldn't run ssh config in ${path}.`);
      }

      const matches = sshCommand.match(/-i ([^\n\r]+)/);
      if (!matches) {
        throw new Error("Couldn't any key in core.sshCommand.");
      }

      const keyPath = matches[1].replace(/\\\\/g, "\\");
      if (!keyPath) {
        throw new Error("Couldn't format the path to the key.");
      }

      return new GitKey(keyPath);
    } catch (err) {
      console.error("Had problems finding the SSH key.");
    }

    throw new Error("Unknown error has occurred, make sure all your parameters are valid.");
  }

  dispose() {
    if (!this.saveCreds) {
      return fs.promises.unlink(this.keyPath);
    }
    return Promise.resolve();
  }
}

module.exports = GitKey;
