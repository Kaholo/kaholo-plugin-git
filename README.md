# kaholo-plugin-git
Git plugin for Kaholo. 

This plugin is a wrapper for the git cli. The git cli must be installed on the agent for this to work. The git version must be equal or higher than 2.10.0, because the `core.sshCommand` configuration feature is used.

## Authentication
You can choose one of the two authentication methods:
1. ```SSH key``` - must be added and stored in the Kaholo Vault. 

2. ```Username``` + ```password``` - must be added and stored in the Kaholo Vault. This works only with HTTPS git repo URLs.

### Public repositories
Public repositories can be cloned without providing credentials. It is only required to specify the URL of the repository and the local folder path in which to clone. Please use only HTTPS repo URLs for public repositories. Anonymous SSH is not supported by the plugin, nor is it supported by popular git-based repo providers.

### Private repositories
When cloning a private repository, you can choose to authenticate either with ```SSH key``` or ```Username``` + ```password```. It is also required to specify the URL of the  repository and the local folder path in which to clone. SSH key is recommended. Some providers may require a personal access token instead of an ordinary password. The same parameter, `Password`, can be used for this.

## Settings
1. Default SSH Key (Vault) **Optional** - This SSH key will be used when no SSH key is specified at the individual Action level. [Learn More](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

## Method: Clone private repository
Clone the specified private git repository. Learn more about cloning [here](https://git-scm.com/docs/git-clone).

Can clone using either ```SSH key``` with a NON-HTTPS URL or ```Username``` + ```password``` with an HTTPS URL.

The **Save Credentials** parameter stores the SSH key in a temporary file, e.g. `/usr/src/app/libs/plugins/git/git-key-6643a943-ccf1-447e-bb03-8b64a5caf2c9.pem`. This file is then referenced as the SSH key to use for all git commands via git configuration item `core.sshCommand`. This allows other methods to work without providing SSH key again and again. The key is removed each time the private repository is recloned with Save Credentials not enabled, or when method Remove And Clean Repository is used.

### Parameters
1. SSH Key (Vault) **Optional** - If provided, use the specified key to connect with SSH to the repository URL for cloning.
2. Username (String) **Optional** - If provided, use the specified username to authenticate.
3. Password (Vault) **Optional** - If provided, use the specified password to authenticate.
4. Repository (String) **Required** - The URL of the repository to clone. Needs to be in SSH format in case SSH key was provided.
5. Branch (String) **Optional** - The branch of the repository to clone from. On default clone from the repo's default branch.
6. Clone Path (String) **Required** - The path to clone the repository to. It is encouraged to specify a path that does not yet exist.
7. Additional Arguments (Text) **Optional** - If specified, use the provided arguments with the ```git clone``` command.  Can enter multiple arguments by separating each argument with a new line.
8. Overwrite If Exists (Boolean) **Optional** - If true and the path provided is not an empty folder, delete it before cloning. If it's a git repository also delete the associated SSH key if it was stored.
9. Save Credentials (Boolean) **Optional** - If true, save the SSH key used to clone, in order to to be able and do more git commands on the repository. 

## Method: Clone public repository
Clone the specified public git repository. Credentials are not required.

### Parameters
1. Repository (String) **Required** - The URL of the repository to clone. Only HTTPS format is supported for public repositories.
2. Branch (String) **Optional** - The branch of the repository to clone from. On default clone from the repo's default branch.
3. Clone Path (String) **Required** - The path to clone the repository to. 
4. Additional Arguments (Text) **Optional** - If specified, use the provided arguments with the ```git clone``` command.  Can enter multiple arguments by separating each argument with a new line.
5. Overwrite If Exists (Boolean) **Optional** - If true and the path provided is not an empty folder, delete it before cloning.

## Method: Pull
Perform a ```git pull``` command on an existing folder containing a git repository. [Learn More](https://git-scm.com/docs/git-pull)

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Force Pull (Boolean) **Optional** - If true, use the "Force" flag when pulling.
3. Commit Merge (Boolean) **Optional** - If true, commit any merges happened by the pull.
4. Additional Arguments (Text) **Optional** - If specified, add the specified arguments to the ```git pull``` command. Can enter multiple arguments by separating each argument with a new line.

## Method: Push Tag
Create a new tag for the current branch and commit on an existing directory containing a git repository. Also push the tag unless specified otherwise. [Learn More](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Username (String) **Required for push If not specified in clone** - The username to use to push to the repository.
3. Email (String) **Required for push If not specified in clone** - The email to use to push to the repository.
4. Tag Name (String) **Required** - The name of the tag to create.
5. Tag Message (String) **Optional** - If specified, attach the specified message to the tag. If not specified, tag created will be a "lightweight" tag with no message.
6. Don't Push (Boolean) **Optional** - If true, don't push the tag created to the remote repository.

## Method: Add Commit And Push
Create a new commit with all new changes for an existing directory containing a git repository. Also push the commit unless specified otherwise. Learn more about [commit](https://git-scm.com/docs/git-commit) and [push](https://git-scm.com/docs/git-push).

### Parameters
1. Repository Path (String) **Required** - The path of the folder containing the git repository.
2. Username (String) **Required for push If not specified in clone** - The username to use to push to the repository.
3. Email (String) **Required for push If not specified in clone** - The email to use to push to the repository.
4. Commit Message (String) **Required** - A message about the commit to attach to it.
5. Override Add Arguments (Text) **Optional** - If specified, use the specified arguments for the ```git add``` command instead of adding all changed files to the commit.
6. Don't Push (Boolean) **Optional** - If true, don't push the commit created to the remote repository.

## Method: Remove And Clean Repository
Delete the directory in the specified path. If the repository is associated with a temporary SSH Key, the SSH Key is also removed. [Learn More](https://git-scm.com/docs/git-clean)

### Parameters
1. Repository Path (String) **Required** - The path of the repository to delete.
