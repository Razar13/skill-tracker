// scripts/fetch-catalog-images.mjs
import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { SKILL_CATALOG } from "../lib/skill-catalog.ts";

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) throw new Error("Set UNSPLASH_ACCESS_KEY in .env first.");

const OUT_PATH = "lib/skill-catalog-images.json";
const allSkills = SKILL_CATALOG.flatMap((c) => c.skills.map((s) => s.name));

// Resume: load whatever was already fetched instead of starting over.
const images = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, "utf-8")) : {};

for (const name of allSkills) {
  if (name in images) {
    console.log(name, "-> already have it, skipping");
    continue;
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(name)}&per_page=1&orientation=landscape&client_id=${KEY}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.log(`Stopped at "${name}" — ${res.status}: ${text}`);
    console.log("This is almost certainly the hourly rate limit. Just run the script again in an hour — it'll pick up right here.");
    break;
  }

  const data = await res.json();
  const photo = data.results?.[0];
  images[name] = photo ? photo.urls.regular : null;
  console.log(name, "->", images[name] ? "found" : "MISSING");

  writeFileSync(OUT_PATH, JSON.stringify(images, null, 2)); // save after every skill, not just at the end
  await new Promise((r) => setTimeout(r, 200));
}

console.log(`Saved ${Object.keys(images).length}/${allSkills.length} to ${OUT_PATH}`);