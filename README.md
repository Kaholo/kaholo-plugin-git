# Kaholo Git Plugin
This plugin extends Kaholo functionality to include running `git` commands. Git is free and open source software for distributed version control. The plugin makes use of the Git CLI, meaning git must be installed on the Kaholo agent for this to work. If for some reason git is not installed, use the [Command Line Plugin](https://github.com/Kaholo/kaholo-plugin-cmd) to run an appropriate command to install git, e.g. `apk add git`.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Authentication
There are two authentication methods available for private repositories:
* `SSH key` - must be stored in the Kaholo Vault. This works only with non-HTTPS repo URIs.
* `Username` + `password` - password must be stored in the Kaholo Vault. This works only with HTTPS git repo URLs.

For Github, support for password authentication was removed on August 13, 2021. In place of password put your personal access token (PAT) instead. You can generate a PAT for yourself in Github's `<> Developer settings`.

### Public repositories
Public repositories can be cloned without providing credentials. It is only required to specify the URL of the repository and the local folder path in which to clone. Please use only HTTPS repo URLs for public repositories. Anonymous SSH is not supported by the plugin, nor is it supported by popular git-based repo providers.

### Private repositories
When cloning a private repository, you can choose to authenticate either with ```SSH key``` or ```Username``` + ```password```. It is also required to specify the URL of the repository. Some providers may require a personal access token instead of an ordinary password. The same parameter, `Password`, can be used for this.

## Plugin Settings
Plugin settings are accessed at Settings | Plugins and then clicking on the name of the `Git` plugin, which is a blue hyperlink.

### Setting: Default SSH Key
Specify an SSH Key here to automatically populate newly created Git actions with a vaulted SSH Key item, as a convenience. At the action level the parameter may be cleared or changed anytime after the Action is created. Apart from when creating new actions, this setting has no effect.

## Method: Clone Private Repository
Clone a private repository, i.e. one requiring authentication. Either a URI with SSH Key or an HTTPS URL with username and password will work. HTTPS URLs will not work with SSH Keys. Using Github as an example, repository URL `https://github.com/Kaholo/kaholo-plugin-git.git`, if a private repository, would require a username and personal access token (PAT), which would be used as the password. However repository URI `git@github.com:Kaholo/kaholo-plugin-git.git` would require an SSH key.

For Public Repositories such as `https://github.com/Kaholo/kaholo-plugin-git.git`, use the HTTPS URL and method "Clone Public Repository" instead.
### Parameter: SSH Key
When using a repository URI, provide the vaulted SSH Key item here. This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`. If SSH Key is provided username and password are not required.
### Parameter: Username
When using a repository HTTPS URL, provide username here.
### Parameter: Password
When using a repository HTTPS URL, provide password here. If using personal access token or OAuth token such as with Github, provide the token here.
### Parameter: Repository
The URI or URL to the repository goes here.
### Parameter: Branch
By default the plugin will clone the master/main branch. To checkout another branch while cloning, specify which branch here.
### Parameter: Clone Path
By default the plugin will clone the repository into a subfolder of the default working directory named after the repository. For example if cloning `https://github.com/Kaholo/kaholo-plugin-git.git`, the root of the repository will be found in `kaholo-plugin-git`. If using the default Kaholo Agent, this is equivalent to `./kaholo-plugin-git` and `/twiddlebug/workspace/kaholo-plugin-git`. Either relative or absolute path may be used.
### Parameter: Additional Arguments
To fine-tune the command to do precisely as required, one may provide additional arguments for the command here. Enter arguments one per line.
### Parameter: Overwrite If Exists
If the Clone Path is already occupied by a previous clone of the repository or anything else, selecting this option will cause that directory to be recursively deleted before the clone command is run.

## Method: Clone Public Repository
This method clones public repositories, meaning those that may be cloned without authentication.
### Parameter: Repository
The HTTPS URL to the repository goes here.
### Parameter: Branch
By default the plugin will clone the master/main branch. To checkout another branch while cloning, specify which branch here.
### Parameter: Clone Path
By default the plugin will clone the repository into a subfolder of the default working directory named after the repository. For example if cloning `https://github.com/Kaholo/kaholo-plugin-git.git`, the root of the repository will be found in `./kaholo-plugin-git`. If using the default Kaholo Agent, this is also `/twiddlebug/workspace/kaholo-plugin-git`. Either relative or absolute path may be used.
### Parameter: Additional Arguments
To fine-tune the command to do precisely as required, one may provide additional arguments for the command here. Enter arguments one per line.
### Parameter: Overwrite If Exists
If the Clone Path is already occupied by a previous clone of the repository or anything else, selecting this option will cause that directory to be recursively deleted before the clone command is run.

## Method: Pull
Used to do a `git pull` in a directory that is aleady a git repository on the Kaholo Agent, for example one previously already cloned. This method supports only repositories of the URI type, using SSH Key authentication. For pulling from HTTPS type repositories, use method "Run Git Command" instead.
### Parameter: SSH Key
Provide the vaulted SSH Key item here, used to authenticate with URI-type private repositories. This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`.
### Parameter: Repository Path
The absolute or relative path to an already existing repository on the Kaholo agent. For example after cloning `https://github.com/Kaholo/kaholo-plugin-git.git` with an empty "Clone Path" parameter, the Repository Path is `kaholo-plugin-git`.
### Parameter: Force Fetch
Applies the -f option to the command. When git is used with <src>:<dst> refspec it may refuse to update the local branch. This overrides that check.
### Parameter: Commit Merge
This is default git behavior, if merge succeeds to perform a commit, typically fast-forward type.
### Parameter: Additional Arguments
To fine-tune the command to do precisely as required, one may provide additional arguments for the command here.

## Method: Push
Push changes from the Kaholo Agent back to origin or another Git repository.
### Parameter: Repository Path
The absolute or relative path to an already existing repository on the Kaholo agent. For example after cloning `https://github.com/Kaholo/kaholo-plugin-git.git` with an empty "Clone Path" parameter, the Repository Path is `kaholo-plugin-git`.
### Parameter: Remote
The "remote" repository that is destination of a push operation. This parameter can be either a URL (see the section GIT URLS below) or the name of a remote. Most commonly and by default this is simply `origin`.
### Parameter: Branch
Most commonly this source is the name of the branch you would want to push, but it can also be any arbitrary "SHA-1 expression", such as master~4 or HEAD. If left empty it will push the branch that is currently checked out, which is the most common use case for method "Push".
### Parameter: SSH Key
Provide the vaulted SSH Key item here, used to authenticate with URI-type private repositories. This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`. Pushing with username/password is not supported.
### Parameter: Additional Arguments
To fine-tune the command to do precisely as required, one may provide additional arguments for the command here. Enter arguments one per line.

## Method: Tag
This create a Tag in a Git repository and optionally pushes the tag to origin.
### Parameter: Repository Path
The absolute or relative path to an already existing repository on the Kaholo agent. For example after cloning `https://github.com/Kaholo/kaholo-plugin-git.git` with an empty "Clone Path" parameter, the Repository Path is `kaholo-plugin-git`.
### Parameter: Username
Use to identify the user creating the tag - not for authentication. The username entered here is for use with command `git config user.name`. This must be provided in order to create a tag.
### Parameter: Email
Use to identify the user creating the tag - not for authentication. The email entered here is for use with command `git config user.email`. This must be provided in order to create a tag.
### Parameter: Tag
The tag itself goes here, typically following Semantic Versioning, e.g. `v1.2.3`, but otherwise any string.
### Parameter: Tag Message
The tag message is an optional annotation explaining what the tag is or why it exists.
### Parameter: Push Tag to Origin
If selected the tag will be pushed to origin. An SSH Key must be provided to do this.
### Parameter: SSH Key
Provide the vaulted SSH Key item here, used to authenticate with URI-type private repositories. This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`. Tagging with username/password is not supported.

## Method: Commit
This method commits changes in the repository and optionally pushes them to origin.
### Parameter: Repository Path
The absolute or relative path to an already existing repository on the Kaholo agent. For example after cloning `https://github.com/Kaholo/kaholo-plugin-git.git` with an empty "Clone Path" parameter, the Repository Path is `kaholo-plugin-git`.
### Parameter: Username
Use to identify the user creating the tag - not for authentication. The username entered here is for use with command `git config user.name`. This must be provided in order to make a commit.
### Parameter: Email
Use to identify the user creating the tag - not for authentication. The email entered here is for use with command `git config user.email`. This must be provided in order to make a commit.
### Parameter: Commit Message
The commit message is required, and typically explains the changes made and why they were necessary.
### Parameter: Additional Arguments
To fine-tune the command to do precisely as required, one may provide additional arguments for the command here. Enter arguments one per line.
### Parameter: Push Commit to Origin
If selected the commit will be pushed to the origin. This requires an SSH Key.
### Parameter: SSH Key
Provide the vaulted SSH Key item here, used to authenticate with URI-type private repositories. This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`. Committing with username/password is not supported.

## Method: Run Git Command
This method runs any arbitrary Git command, including those covered by other methods such as `git clone`, `git pull`, and `git tag`. The method is provided to allow almost any arbitrary command. For example:

    git branch --all --sort=-committerdate

    git --version

    git push origin --delete tempbranch

### Parameter: Command
The complete command to run. Commands must start with `git`.
### Parameter: Working Directory
The directory on the Kaholo agent to assume as the working directory before executing the command. For example if running `git pull`, the working directory should be an existing repository, for example a previously cloned repository in directory `kaholo-plugin-git`. 
### Parameter: SSH Key
This is the private key, e.g. beginning with `-----BEGIN OPENSSH PRIVATE KEY-----`. The key is stored in a temporary file and made accessible to the command using environment variable `$KAHOLO_GIT_SSH_KEY_PATH`. After the command has run the file is then securely deleted.
### Parameter: Password
This is a password or personal access token (PAT), stored in the Kaholo Vault. While passwords could be included directly in the command, to prevent them from appearing in the UI, logs, and potential error messages it is recommended to store them in the Vault instead. In the command the password can be accessed as environment variable $KAHOLO_GIT_PASSWORD.