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

  let childProcessError;
  const childProcessInstance = childProcess.exec(command, options);

  childProcessInstance.stdout.on("data", (data) => {
    onProgressFn?.(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
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

  return "";
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
