const os = require("os");
const path = require("path");
const fsExtra = require("fs-extra");
const kaholoPluginLibrary = require("@kaholo/plugin-library");

const { execCommand } = require("./helpers");

const HOME_DIRECTORY = os.homedir();

function untildify(pathString) {
  return HOME_DIRECTORY ? pathString.replace(/^~(?=$|\/|\\)/, HOME_DIRECTORY) : pathString;
}

async function tryDeleteDirectoryRecursively(pathString) {
  const normalizedPath = path.normalize(untildify(pathString));
  if (!await fsExtra.pathExists(normalizedPath)) {
    return false;
  }

  try {
    await fsExtra.emptyDir(normalizedPath, { recursive: true });
  } catch {
    // no problem
  }

  return true;
}

async function shredFile(filePath) {
  const shredFilePathInfo = await kaholoPluginLibrary.helpers.analyzePath(filePath);
  if (!shredFilePathInfo.exists || !shredFilePathInfo.type === "file") {
    return null;
  }

  console.error(`\nShredding file at ${filePath}\n`);
  return execCommand(`shred -n 3 -f ${filePath}`);
}

module.exports = {
  shredFile,
  tryDeleteDirectoryRecursively,
  untildify,
};
