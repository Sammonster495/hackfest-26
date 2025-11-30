import "dotenv/config";
import db from "./index";
import { colleges } from "./schema";

async function seed() {
  console.log("Seeding colleges...");

  // Check if colleges already exist
  const existing = await db.select().from(colleges).limit(1);
  if (existing.length > 0) {
    console.log("⚠️  Colleges already exist. Skipping seed.");
    return;
  }

  const collegeData = Array.from({ length: 20 }, (_, i) => ({
    name: `College ${i + 1}`,
    state: null,
  }));

  try {
    await db.insert(colleges).values(collegeData);
    console.log(`✅ Seeded ${collegeData.length} colleges`);
  } catch (error) {
    console.error("Error seeding colleges:", error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log("Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
