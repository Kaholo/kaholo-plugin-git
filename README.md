# kaholo-plugin-git
Git plugin for Kaholo

This plugin is a wrapper for the git cli. Therefore git cli must be installed on the agent. 

Git version must be equal or higher than 2.10.0, due to the usage of the `core.sshCommand` used.


## Key storing ##


The SSH key is taken from the vault, currently the Kaholo vault does not support multiline strings. 
Therefore please format your key by removing newlines and replace them with `\n`.

For example, the following key:
```text
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
-----END OPENSSH PRIVATE KEY-----

```

Should become:
```text
-----BEGIN OPENSSH PRIVATE KEY----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\n-----END OPENSSH PRIVATE KEY-----\n
```

The plugin code restructures it correctly behind the scenes.

### Keys precedence ###
In any action that takes a SSH key as a parameter, precedence will be given to it over the key set in the settings.
Allowing to use the settings key as the default key when no other key is provided.


## Settings ##

1. SSH key - chose key from vault to be used as the default key when no other keys are specified.


## Method: Clone using SSH

**Description**

This method calls clone a git repository using a SSH key.
The key can either be supplied in the plugin settings or in the action parameter, while action parameter key will have precedence over the settings key.



**Parameters**
1. SSH key - The key to use for the clone
2. Repo - the full repository ssh uri (i.e. `git@github.com:Kaholo/kaholo-plugin-git.git`)
3. Clone path - The path to clone the repository to. We recommand using absolute path values.