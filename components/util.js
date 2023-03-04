const path = require("path")
const fs = require("fs")

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

const isPortOccupied = async (port) => {
    return await new Promise((resolve, reject) => {
        const server = require("net").createServer().listen(port)
        server.on("listening", () => {
            server.close()
            resolve(false)
        })
        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                resolve(true)
            }
        })
    })
}


module.exports = {
    safePath,
    merge,
    isPortOccupied
}