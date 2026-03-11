import { NextResponse } from 'next/server';
import colleges from '../../../data/indianColleges.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search")?.toLowerCase() || "";

    if (!query) {
      // If no query, return an empty array to save bandwidth
      return NextResponse.json([]);
    }
    // Define North-East states to exclude from the massive dataset
    const northEastStates = ['assam', 'arunachal pradesh', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'sikkim'];

    // Performance optimization: Find all that include the query, then limit to 20 maximum results
    const collegesArray = colleges as any[];
    const results = collegesArray
      .filter((college: any) => {
        const lowerState = (college.state || "").toLowerCase();
        if (northEastStates.some(nes => lowerState.includes(nes))) return false;
        return college.name.toLowerCase().includes(query);
      })
      .slice(0, 20);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Institution Search Exception:", error);
    return NextResponse.json({ error: "Failed to search institutions" }, { status: 500 });
  }
}
