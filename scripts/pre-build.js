const shell = require("child_process").execSync;
const path = require("path");

const dist = path.resolve(__dirname, "../", "dist");

const envFrom = path.resolve(__dirname, "../", ".env");
const envTo = path.resolve(__dirname, "../", "dist", ".env");

shell(`mkdir -p ${dist}`);
shell(`cp -p ${envFrom} ${envTo}`);
