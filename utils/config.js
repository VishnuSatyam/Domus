if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const dns = require("node:dns");

function configureDnsServers() {
  const configuredServers = process.env.DNS_SERVERS;
  if (!configuredServers) return;

  const servers = configuredServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (!servers.length) {
    throw new Error("DNS_SERVERS must contain at least one comma-separated DNS server.");
  }

  dns.setServers(servers);
}

configureDnsServers();

const dbUrl = process.env.ATLASDB_URL;
const sessionSecret = process.env.SESSION_SECRET || process.env.SECRET;

function requireDatabaseUrl() {
  if (!dbUrl) {
    throw new Error("ATLASDB_URL must be set before starting Domus.");
  }
  return dbUrl;
}

function requireSessionSecret() {
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET (or legacy SECRET) must be set before starting Domus.");
  }
  return sessionSecret;
}

module.exports = { dbUrl, sessionSecret, requireDatabaseUrl, requireSessionSecret };
