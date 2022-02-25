# Taskfile.ts Usage

Thanks to https://dev.to/vonheikemen/a-simple-way-to-replace-npm-scripts-in-deno-4j0g for this simple but powerful idea.

## Set up aliases

Linux setup, as suggested in https://github.com/netspective-studios/home-creators/blob/main/dot_config/z4h-zshrc/deno.auto.zshrc.tmpl:

```bash
# cwd-task runs Taskfile.ts at the current working directory only
alias cwd-task='deno run --unstable -A ./Taskfile.ts'

# path-task runs Taskfile.ts at the current path, parent path, or ancestor paths (whichever comes first)
alias path-task=$'deno run --unstable -A $(/bin/bash -c \'file=Taskfile.ts; path=$(pwd); while [[ "$path" != "" && ! -e "$path/$file" ]]; do path=${path%/*}; done; echo "$path/$file"\')'

# repo-task runs Taskfile.ts at the Git repo's home directory (same as legacy deno-task alias)
alias repo-task='deno run --unstable -A $(git rev-parse --show-toplevel)/Taskfile.ts'
```

Windows PowerShell setup would be something like this (TODO: figure out the automation like above for repo-task and path-task):

```powershell
Set-Alias -Name cwd-task -Value deno run --unstable -A ./Taskfile.ts
Set-Alias -Name path-task -Value deno run --unstable -A ...???
Set-Alias -Name repo-task -Value deno run --unstable -A ...???
```

## Operate aliases

```bash
repo-task inspect    # runs Taskfile.ts 'inspect' task at the Git repo root directory
path-task inspect    # runs Taskfile.ts 'inspect' task at either the current directory, parent, or ancestor (whichever is found first)
cwd-task inspect     # runs Taskfile.ts 'inspect' task in the current working directory
```

# TODO

* integrate [udd](https://github.com/hayd/deno-udd) as a built-in task so `find . -name "*.ts" | xargs udd` is not required outside of Deno
* wrap [xargs](https://github.com/tarruda/node-xargs) in this module?
* wrap [deno xeval](https://deno.land/std/examples/xeval.ts) in this module? [elaboration](https://stefanbuck.com/blog/hidden-superpower-deno-xeval)
