#!/usr/bin/env node
/**
 * check-clerk-fapi.mjs
 *
 * Decode the Clerk publishable key, derive its frontend API host
 * (FAPI), and probe https://<host>/v1/environment to confirm the
 * SSL certificate is valid and the host is reachable.
 *
 * Run before any TestFlight / App Store / Play Store build:
 *   pnpm --filter @workspace/biteiq run check:clerk
 *
 * Pass a key explicitly:
 *   node scripts/check-clerk-fapi.mjs pk_live_xxxxx
 *
 * Exits non-zero if the cert is invalid or the host cannot be reached.
 */

import https from "node:https";
import { Buffer } from "node:buffer";

const KEY =
  process.argv[2] ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY;

if (!KEY) {
  console.error(
    "ERROR: No publishable key provided.\n" +
      "Pass it as the first argument or set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_PUBLISHABLE_KEY.",
  );
  process.exit(2);
}

function decodeFapiHost(key) {
  const m = /^(pk_(?:test|live)_)(.+)$/.exec(key);
  if (!m) {
    throw new Error(
      `Unexpected key prefix (expected pk_test_ or pk_live_). Got: ${key.slice(0, 8)}…`,
    );
  }
  const prefix = m[1];
  let payload = m[2];
  const dollar = payload.indexOf("$");
  if (dollar >= 0) payload = payload.slice(0, dollar);
  let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const decoded = Buffer.from(b64, "base64").toString("utf8");
  return { prefix, host: decoded.replace(/\$+$/, "") };
}

function probe(host) {
  return new Promise((resolve) => {
    const started = Date.now();
    const req = https.request(
      {
        host,
        path: "/v1/environment",
        method: "GET",
        timeout: 8000,
        headers: { "User-Agent": "biteiq-clerk-fapi-check" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: true,
            status: res.statusCode,
            elapsedMs: Date.now() - started,
            cert: res.socket?.getPeerCertificate?.() || null,
            bodyPreview: body.slice(0, 200),
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("Request timed out after 8s"));
    });
    req.on("error", (err) => {
      resolve({
        ok: false,
        error: err.message,
        code: err.code,
        elapsedMs: Date.now() - started,
      });
    });
    req.end();
  });
}

const { prefix, host } = decodeFapiHost(KEY);
console.log(`Key prefix : ${prefix}`);
console.log(`FAPI host  : ${host}`);
console.log(`Probing    : https://${host}/v1/environment\n`);

const result = await probe(host);

if (!result.ok) {
  console.error(`FAIL (${result.elapsedMs}ms): ${result.error}`);
  if (result.code) console.error(`Code: ${result.code}`);
  if (
    /alt(ernative)? certificate subject/i.test(result.error || "") ||
    /CERT_/.test(result.code || "")
  ) {
    console.error(
      "\nThis looks like an SSL certificate problem on the Clerk frontend API host.\n" +
        "If you are using a pk_live_ key, switch to a pk_test_ key for builds\n" +
        "until the live host's certificate is provisioned.",
    );
  }
  process.exit(1);
}

console.log(`HTTP ${result.status} in ${result.elapsedMs}ms`);
if (result.cert) {
  const c = result.cert;
  console.log(`Cert CN   : ${c.subject?.CN || "(none)"}`);
  console.log(`Cert SAN  : ${c.subjectaltname || "(none)"}`);
  console.log(`Cert from : ${c.valid_from}`);
  console.log(`Cert to   : ${c.valid_to}`);
}

if (result.status >= 200 && result.status < 500) {
  console.log("\nOK: Clerk frontend API is reachable.");
  process.exit(0);
}
console.error("\nFAIL: unexpected HTTP status from Clerk frontend API.");
process.exit(1);
