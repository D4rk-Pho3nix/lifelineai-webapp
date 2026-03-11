import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data");

const filesToMerge = [
  "indianColleges.json",
  "indianCollegesUnified.json",
  "tamilNaduExtraColleges.json"
];

const mergedMap = new Map();

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

filesToMerge.forEach((file) => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    console.log(`Reading ${file}...`);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      data.forEach((college: any) => {
        if (!college.name || !college.district || !college.state) return;
        const key = normalize(college.name) + college.district.toLowerCase() + college.state.toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, college);
        }
      });
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
  }
});

const output = path.join(dir, "indianColleges.json");
const mergedArray = [...mergedMap.values()];
fs.writeFileSync(output, JSON.stringify(mergedArray, null, 2));

console.log(`Merged ${mergedArray.length} items into indianColleges.json`);

// Delete other files
filesToMerge.forEach((file) => {
  if (file !== "indianColleges.json") {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
      console.log(`Deleting ${file}...`);
      fs.unlinkSync(filePath);
    }
  }
});

console.log("Done.");
