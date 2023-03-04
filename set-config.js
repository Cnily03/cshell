#!/usr/bin/env node

const path = require("path")
const fs = require("fs")
const program = require("commander")
const exit = require("process").exit
const {
    safePath
} = require("./components/util")

helpMessage = () => program.outputHelp()


program
    .name("cshell-conf")
    .usage(["<path>", "[options]"].join(", "))

    .option("-c, --clear", "clear the config file path globally")
    .option("-h, --help", "show help")
    .helpOption(false)

    .arguments("[path]", "set the config file path globally")
    .action(_path => {
        if (!_path) return
        let fp = safePath(_path)
        let text
        try {
            let new_config = require(fp)
            text = JSON.stringify(new_config, null, 4)
        } catch (e) {
            console.error("Invalid JSON file.")
            exit(1)
        }
        fs.writeFileSync(path.resolve(__dirname, "./default.json"), text)
        console.info("Config file is saved.")
        exit(1)
    })

    .parse(process.argv)

const options = program.opts()
if (options.help) helpMessage()
if (options.clear) {
    fs.writeFileSync(path.resolve(__dirname, "./default.json"), "{}")
    console.info("Config file path cleared.")
}

if (!Object.keys(options).length) helpMessage()