import { randomBytes, scryptSync } from "node:crypto";
const key = randomBytes(32).toString("hex"),
  password = randomBytes(24).toString("base64url"),
  salt = randomBytes(16).toString("hex");
console.log("DASHBOARD_PAIRING_KEY=" + key);
console.log("ADMIN_PASSWORD=" + password);
console.log(
  "ADMIN_PASSWORD_HASH=scrypt:" +
    salt +
    ":" +
    scryptSync(password, salt, 64).toString("hex"),
);
