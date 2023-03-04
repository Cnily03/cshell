const program = require("commander")
const path = require("path")
const fs = require("fs")
const {
    safePath,
    merge
} = require("./util")

program
    .name("cshell")
    .version(require("../package.json").version, "-v, --version", "output the current version")
    .option("-c, --config <path>", "use custom config")

const USER_CONFIG = merge(
    require(program.opts().config ? safePath(program.opts().config) : "../default.json"),
    require("../default.fallback.json")
)

const DEFAULT = {
    SERVER_HOST: USER_CONFIG["server-host"].trim(),
    SERVER_PORT: USER_CONFIG["server-port"],
    SHELL_HOST: USER_CONFIG["shell-host"].trim(),
    SHELL_PORT: USER_CONFIG["shell-port"],
    STATIC: (USER_CONFIG.static || "").trim(),
    FILE_PATH: (USER_CONFIG.file || "").trim(),
    CONTENT_TYPE: USER_CONFIG["content-type"].trim(),
    DEFAULT_FILE_CONTENT: USER_CONFIG["default-file-content"]
}

program
    .name("cshell")
    .option("-H, --server-host <host>", "set host of the http server to visit", DEFAULT.SERVER_HOST)
    .option("-P, --server-port <port>", "set port of the http server", DEFAULT.SERVER_PORT)
    .option("-h, --shell-host <host>", "set host of the master controller", DEFAULT.SHELL_HOST)
    .option("-p, --shell-port <port>", "set port for shell of the master controller", DEFAULT.SHELL_PORT)
    .option("--host <host>", "alias of --server-host and --shell-host")
    .option("--port <port>", "alias of --server-port and --shell-port")
    .option("-s, --static <path>", "set static directory of the http server", DEFAULT.STATIC || undefined)
    .option("-t, --content-type <type>", "set content type of the attached file", DEFAULT.CONTENT_TYPE)
    .option("--help", "show this help message")
    .arguments("[path]", "the content in the file will be shown on the server", DEFAULT.FILE_PATH)
    .parse(process.argv)

program.addHelpText("after", "\n" + [
    "Copyright (c) 2023 Jevon Wang, MIT License",
    "Source code: https://github.com/Cnily03/cshell"
].join("\n"));

const options = program.opts()
const args = {
    path: program.args[0]
}

// port
if (options.host) options.serverHost = options.shellHost = options.host
if (options.port) options.serverPort = options.shellPort = options.port

for (const key in options)
    if (typeof options[key] !== "undefined") options[key] = options[key].toString()

// file content
function insertArgv(content) {
    return content
        .replace(/\$\{\{ *?env\.server_host *?\}\}/g, options.serverHost)
        .replace(/\$\{\{ *?env\.server_port *?\}\}/g, options.serverPort)
        .replace(/\$\{\{ *?env\.shell_host *?\}\}/g, options.shellHost)
        .replace(/\$\{\{ *?env\.shell_port *?\}\}/g, options.shellPort)
}

options.fileContent = args.path ?
    insertArgv(fs.readFileSync(safePath(args.path))) :
    insertArgv(DEFAULT.DEFAULT_FILE_CONTENT)

module.exports = {
    program,
    options,
    args
}