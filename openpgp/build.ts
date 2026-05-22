import { readdirSync, mkdirSync } from "node:fs";
import { basename } from "node:path";

const ZBASE32_ALPHA = "ybndrfg8ejkmcpqxot1uwisza345h769";

function encodeZBase32(data: Uint8Array): string {
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of data) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += ZBASE32_ALPHA[(buffer >> bitsLeft) & 0x1f];
    }
  }
  return result;
}

function dearmor(armored: string): Uint8Array {
  const lines = armored.split("\n").map((l) => l.trimEnd());

  // 空行の次から本文開始
  let bodyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === "") {
      bodyStart = i + 1;
      break;
    }
  }
  if (bodyStart === -1)
    throw new Error("Invalid PGP armor: no blank line found");

  // CRC行 (= で始まる) またはフッタまでを本文とする
  const bodyLines: string[] = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("=") || line.startsWith("-----")) break;
    bodyLines.push(line);
  }

  const b64 = bodyLines.join("");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

const HEADERS = `\
/.well-known/openpgpkey/hu/*
  Content-Type: application/octet-stream
  Access-Control-Allow-Origin: *

/.well-known/openpgpkey/policy
  Content-Type: text/plain
  Access-Control-Allow-Origin: *
`;

const keysDir = new URL("./keys", import.meta.url).pathname;
const outBase = new URL("./dist", import.meta.url).pathname;
const huDir = `${outBase}/.well-known/openpgpkey/hu`;

mkdirSync(huDir, { recursive: true });

const ascFiles = readdirSync(keysDir).filter((f) => f.endsWith(".asc"));

for (const file of ascFiles) {
  const localpart = basename(file, ".asc").toLowerCase();
  const armored = await Bun.file(`${keysDir}/${file}`).text();
  const binary = dearmor(armored);

  const localpartBytes = new TextEncoder().encode(localpart);
  const sha1 = await crypto.subtle.digest("SHA-1", localpartBytes);
  const hash = encodeZBase32(new Uint8Array(sha1));

  await Bun.write(`${huDir}/${hash}`, binary);
  console.log(`${file} -> hu/${hash}`);
}

await Bun.write(`${outBase}/.well-known/openpgpkey/policy`, "");
await Bun.write(`${outBase}/_headers`, HEADERS);

console.log("Done.");
