const { exec } = require("child_process");
const fsp = require("fs/promises");
const path = require("path");
require("dotenv").config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

const infoFrom = path.join(__dirname, "../", "dist", ".twiliodeployinfo");
const infoTo = path.join(__dirname, "../", ".twiliodeployinfo");

(async () => {
  exec(`cp ${infoFrom}/* ${infoTo}`);
  const infoText = await fsp.readFile(infoFrom);
  const sid = Object.values(JSON.parse(infoText))[0].serviceSid;
  await client.serverless.services(sid).update({ uiEditable: true });
})();
