// Run: node scripts/generate-pin.mjs 1234
import { hash } from "bcryptjs";

const pin = process.argv[2];
if (!pin || pin.length !== 4) {
  console.error("Uso: node scripts/generate-pin.mjs 1234");
  process.exit(1);
}

const hashed = await hash(pin, 10);
console.log(`\nPIN: ${pin}`);
console.log(`Hash: ${hashed}`);
console.log(`\nCole no .env:`);
console.log(`APP_PIN_HASH="${hashed}"`);
