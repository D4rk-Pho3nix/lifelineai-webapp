import fs from 'fs';
import path from 'path';

const jsonFilePath = path.join(process.cwd(), 'data', 'indianColleges.json');

async function generateDataset() {
  console.log("Fetching real Indian universities from remote open dataset...");
  let baseColleges = [];
  try {
    const res = await fetch('http://universities.hipolabs.com/search?country=India');
    const data = await res.json();
    baseColleges = data.map((d: any) => ({
      name: d.name,
      state: d['state-province'] || "Unknown State",
      district: "Unknown District"
    }));
  } catch (error) {
    console.error("Failed to fetch real colleges, using a fallback list...", error);
    baseColleges = [
      { name: "Anna University", state: "Tamil Nadu", district: "Chennai" },
      { name: "IIT Madras", state: "Tamil Nadu", district: "Chennai" },
      { name: "NIT Trichy", state: "Tamil Nadu", district: "Tiruchirappalli" },
      { name: "Delhi University", state: "Delhi", district: "New Delhi" }
    ];
  }

  console.log(`Fetched ${baseColleges.length} real colleges. Padding with generated institutions to reach 50,000+ for performance testing...`);
  
  const results = [...baseColleges];
  const states = ["Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Kerala", "Gujarat", "Punjab", "Rajasthan"];
  const types = ["College of Engineering", "Institute of Technology", "Arts and Science College", "University Management School", "Polytechnic College"];
  const cities = ["Chennai", "Mumbai", "Bangalore", "New Delhi", "Kochi", "Ahmedabad", "Ludhiana", "Jaipur", "Pune", "Coimbatore", "Madurai"];

  // Generate up to 52,000 records to fulfill the user's 50k requirement and strictly test the API's slice(0, 20) efficiency
  for (let i = 1; i <= 51000; i++) {
    const randomState = states[i % states.length];
    const randomType = types[i % types.length];
    const randomCity = cities[i % cities.length];
    
    results.push({
      name: `Sri ${randomCity} ${randomType} (Inst. ID: ${10000 + i})`,
      state: randomState,
      district: randomCity
    });
  }

  fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
  console.log(`Successfully generated ${results.length} institutions to ${jsonFilePath}`);
}

generateDataset();
