const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const shell = require("child_process").execSync;

const assetsFrom = path.resolve(__dirname, "../", "build");
const assetsTo = path.resolve(__dirname, "../", "dist", "assets");
const assetsAssets = path.resolve(assetsTo, "assets");
const rootFrom = path.resolve(assetsTo, "index.html");
const rootTo = path.resolve(assetsAssets, "index.html");

const envFrom = path.resolve(__dirname, "../", ".env");
const envTo = path.resolve(__dirname, "../", "dist", ".env");

const fnTo = path.resolve(__dirname, "../", "dist", "functions");

const pkg = require("../package.json");
const pkgTo = path.join(__dirname, "../", "dist", "package.json");

const infoFrom = path.join(__dirname, "../", "dist", ".twiliodeployinfo");
const infoTo = path.join(__dirname, "../", ".twiliodeployinfo");

(async () => {
  try {
    shell(`rm -r ${assetsTo}`);
    shell(`rm ${pkgTo}`);
    shell(`rm ${envTo}`);
  } catch {}

  shell(`mkdir -p ${assetsTo}`);
  shell(`mkdir -p ${assetsAssets}`);

  shell(`cp -r ${assetsFrom}/* ${assetsTo}`);
  shell(`cp -p ${rootFrom} ${rootTo}`);
  console.log("Copied build to dist/assets");

  shell(`cp -p ${envFrom} ${envTo}`);

  // remove scripts from package for VS Code
  const { scripts, devDependencies: _, ..._pkg } = pkg;
  const dependencies = await getDependencies();
  await fsp.writeFile(pkgTo, JSON.stringify({ ..._pkg, dependencies }));
  console.log("Copied package.json to dist");

  if (fs.existsSync(infoTo)) {
    if (fs.existsSync(infoFrom)) shell(`rm -r ${infoFrom}`);
    shell(`cp ${infoTo}/* ${infoFrom}`);
  }
})();

async function getDependencies() {
  const paths = await getPaths();
  const required = (await Promise.all(paths.map(getImports))).flat(Infinity);

  return Object.fromEntries(
    Object.entries(pkg.dependencies || {}).filter(([key]) =>
      required.some((dep) => dep.startsWith(key))
    )
  );
}

async function getPaths(dir = fnTo) {
  const files = await fsp.readdir(dir);

  const subFiles = await Promise.all(
    files
      .map((file) => path.resolve(dir, file))
      .map(async (file) =>
        fs.statSync(file).isDirectory() ? getPaths(file) : file
      )
  );

  return subFiles.flat(Infinity);
}

async function getImports(file) {
  const text = await fsp.readFile(file, { encoding: "utf-8" });

  return text
    .match(/require\("(.*)"\)/gi)
    ?.map((match) => match.replace(/require\("/, "").replace(/"\)$/, ""))
    .flat(Infinity);
}
