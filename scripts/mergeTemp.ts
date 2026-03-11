import fs from "fs";
import path from "path";

const baseFile = path.join(process.cwd(), "data", "indianColleges.json");
const extraFile = path.join(process.cwd(), "data", "indianColleges.json"); // Just to make it run without error, since the file is removed. Usually we'd delete this script if it's no longer needed, however maybe the user still wants to merge custom jsons. Let's make extraFile empty or some dummy path.
const outputFile = path.join(process.cwd(), "data", "indianColleges.json");

const baseList = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, "utf-8")) : [];
const extraList = fs.existsSync(extraFile) ? JSON.parse(fs.readFileSync(extraFile, "utf-8")) : [];

const mergedMap = new Map();

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

[...baseList, ...extraList].forEach(college => {
  if (!college.name || !college.district || !college.state) return;
  const key = normalize(college.name) + college.district.toLowerCase() + college.state.toLowerCase();
  mergedMap.set(key, college);
});

fs.writeFileSync(outputFile, JSON.stringify([...mergedMap.values()], null, 2));
console.log(`Merged ${mergedMap.size} colleges to unified JSON successfully.`);
