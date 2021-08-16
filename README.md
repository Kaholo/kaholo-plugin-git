# kaholo-plugin-git
Git plugin for Kaholo

This plugin is a wrapper for the git cli. Therefore git cli must be installed on the agent. 

Git version must be equal or higher than 2.10.0, due to the usage of the `core.sshCommand` used.

### Keys precedence ###
In any action that takes a SSH key as a parameter, precedence will be given to it over the key set in the settings.
Allowing to use the settings key as the default key when no other key is provided.

## Settings ##

1. SSH Key - chose key from vault to be used as the default key when no other keys are specified.


## Method: Clone using SSH

**Description**

This method calls clone a git repository using a SSH key if provided.
The key can either be supplied in the plugin settings or in the action parameter, while action parameter key will have precedence over the settings key.
You can use this method like "git pull" in case you already cloned the repo, if specifying overwrite=true.
If the clone path is already in use, and overwrite is false, this command will fail.

**Parameters**
1. SSH Key (Vault) **Optional** - The SSH private key to use for the clone.
2. Repository (String) **Required** - The full repository git\ssh(required in case SSH Key was provided) uri (i.e. `git@github.com:Kaholo/kaholo-plugin-git.git`).
3. Branch (String) **Optional** - The branch of the repository to clone. if not specified will clone the default branch of the repository.
3. Clone path (String) **Required** - The path to clone the repository to. We recommand using absolute path values. '~' shortcut is not supported when running on a windows OS agent.
4. Additional Arguments (Text) **Optional** - Any additional arguments to pass to the clone command. Can enter multiple values by seprating each one with new line or space.
5. Overwrite If Exists (Boolean) **Optional** - Whether to overwrite exisiting path if a repo already exists, or not. default is false.