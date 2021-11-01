# kaholo-plugin-git
Git plugin for Kaholo. 

This plugin is a wrapper for the git cli. Therefore git cli must be installed on the agent. 
Git version must be equal or higher than 2.10.0, due to the usage of the `core.sshCommand` used.

## Settings
1. SSH Key (Vault) **Optional** - SSH key to be used as the default SSH key when no other keys are specified.

## Method: Clone using SSH
Clone the specified git repository. Can clone using SSH in the case an SSH key was provided.
You can use this method like "git pull" in case you already cloned the repo, if specifying overwrite=true.
If the clone path is already in use, and overwrite is false, this command will fail.

### Parameters
1. SSH Key (Vault) **Optional** - If provided, use the specified key to connect with SSH to the repository URL for cloning.
2. Username (String) **Optional** - If provided, save the specified username to use when pushing commits or tags to the repository.
3. Email (String) **Optional** - If provided, save the specified email to use when pushing commits or tags to the repository.
4. Repository (String) **Required** - The URL of the repository to clone. Needs to be in SSH format in case SSH key was provided.
5. Branch (String) **Optional** - The branch of the repository to clone from. On default clone from the repo's default branch.
6. Clone Path (String) **Required** - The path to clone the repository to. **Recomnded to give a new path.**
7. Additional Arguments (Text) **Optional** - If specified, use the provided arguments with the Git clone command.  Can enter multiple argumants by seperating each argument with a new line.
8. Overwrite If Exists (Boolean) **Optional** - If true and the path provided is not an empty folder, delete it before cloning. If it's a git repository also delete the associated SSH key if it was stored.
9. Save Credentials (Boolean) **Optional** - If true, save the SSH key used to clone, in order to to be able and do more git commands on the repository. **Required for the methods: Pull, Push Tag, Add Commit And Push.**

## Method: Pull
Perform a git pull command on an existing folder containing a git repository.

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Force Pull (Boolean) **Optional** - If true use the "Force" flag when pulling.
3. Commit Merge (Boolean) **Optional** - If true, commit any merges happend by the pull.
4. Additional Arguments (Text) **Optional** - If specifed, add the specifed arguments to the Git Pull command. Can enter multiple argumants by seperating each argument with a space or a new line.

## Method: Push Tag
Create a new tag for the current branch and commit on an existing directory containg a git repository. Also push the tag unless specified otherwise.

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Username (String) **Required for push If not specified in clone** - The username to use to push to the repository.
3. Email (String) **Required for push If not specified in clone** - The email to use to push to the repository.
4. Tag Name (String) **Required** - The name of the tag to create.
5. Tag Message (String) **Optional** - If specified, attach the specified message to the tag. If not specified, tag created will be a "lightweight" tag with no message.
6. Don't Push (Boolean) **Optional** - If true, don't push the tag created to the remote repository.

## Method: Add Commit And Push
Create a new commit with all new changes for an existing directory containg a git repository. Also push the commit unless specified otherwise.

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Username (String) **Required for push If not specified in clone** - The username to use to push to the repository.
3. Email (String) **Required for push If not specified in clone** - The email to use to push to the repository.
4. Commit Message (String) **Required** - A message about the commit to attach to it.
5. Override Add Argumants (Text) **Optional** - If specified, use the specified argumants for the Git add command instead of adding all changed files to the commit.
6. Don't Push (Boolean) **Optional** - If true, don't push the commit created to the remote repository.

## Method: Remove And Clean Repository
Delete the directory in the specified path. If contains a git repository with a stored SSH Key, also delete the SSH Key. **Intended to use only on git repositories**.

### Parameters
1. Repository Path (String) **Required** - The path of the folder to delete.