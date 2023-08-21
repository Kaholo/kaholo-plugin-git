const childProcess = require("child_process");

async function execCommand(command, opts = {}) {
  const resolvedOptions = opts;
  if (!resolvedOptions.env) {
    resolvedOptions.env = process.env;
  }

  return new Promise((resolve, reject) => {
    childProcess.exec(command, resolvedOptions, (error, stdout, stderr) => {
      if (error) {
        console.error(stdout);
        return reject(error);
      }

      let newStdout = stdout;
      if (stderr && !stdout) {
        newStdout = `${stderr}\nSuccess!`;
      }
      return resolve(newStdout);
    });
  });
}

function omitNil(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  );
}

module.exports = {
  execCommand,
  omitNil,
};
