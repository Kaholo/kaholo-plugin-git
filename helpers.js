const childProcess = require("child_process");
const { promisify } = require("util");

async function executeCommand(params) {
  const {
    command,
    onProgressFn,
    options = {},
  } = params;
  if (!options.env) {
    options.env = process.env;
  }

  const outputChunks = {
    stdout: [],
    stderr: [],
  };
  let childProcessError;
  const childProcessInstance = childProcess.exec(command, options);

  childProcessInstance.stdout.on("data", (data) => {
    outputChunks.stdout.push(data);
    onProgressFn?.(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    outputChunks.stderr.push(data);
    onProgressFn?.(data);
  });
  childProcessInstance.on("error", (error) => {
    childProcessError = error;
  });

  try {
    await promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    childProcessError = error;
  }

  if (childProcessError) {
    throw childProcessError;
  }

  const outputObject = {
    stdout: outputChunks.stdout.join(""),
    stderr: outputChunks.stderr.join(""),
  };

  if (outputObject.stderr && !outputObject.stdout) {
    outputObject.stdout = outputObject.stderr;
  }

  return outputObject.stdout;
}

function omitNil(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  );
}

module.exports = {
  executeCommand,
  omitNil,
};
