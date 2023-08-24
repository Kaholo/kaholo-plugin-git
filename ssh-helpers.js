const { executeCommand } = require("./helpers");

async function startSshAgent() {
  // check if ssh agent is down or up
  let didTurnAgentUp = false;
  if (!process.env.SSH_AUTH_SOCK) {
    // ssh agent is down so add command to turn it up and save returned env variables
    const sshAgentResult = await executeCommand({
      onProgressFn: (msg) => process.stdout.write(msg || ""),
      command: "ssh-agent",
    });
    // remove newlines and split using both ';' and '='
    const sshAgentResArray = sshAgentResult.replace(/\r?\n|\r/g, "").split(/;|=/);
    [, process.env.SSH_AUTH_SOCK, , , process.env.SSH_AGENT_PID] = sshAgentResArray;
    didTurnAgentUp = true;
  }

  return didTurnAgentUp;
}

async function tryKillSshAgent() {
  try {
    await executeCommand({
      onProgressFn: (msg) => process.stdout.write(msg || ""),
      command: "eval `ssh-agent -k`",
    });
  } catch {} // eslint-disable-line no-empty
}

module.exports = {
  tryKillSshAgent,
  startSshAgent,
};
