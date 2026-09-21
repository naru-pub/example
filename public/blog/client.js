import { config } from "./config.js";
export async function connect() {
  const sdk = await import("https://naru.pub/sdk/1.0.0/naru-data.js");
  return sdk.createNaru(config.site ? { site: config.site } : undefined);
}
