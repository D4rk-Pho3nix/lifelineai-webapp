"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function SupabaseTest() {
  const [status, setStatus] = useState("Checking connection...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("_dummy_check")
        .select("*")
        .limit(1);

      if (error && error.code === "42P01") {
        setStatus("✅ Supabase is connected successfully! (Table not found, but connection works)");
      } else if (error) {
        setStatus("❌ Connection failed: " + error.message);
      } else {
        setStatus("✅ Supabase is connected and working!");
      }
    }
    testConnection();
  }, []);

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, padding: "20px", fontFamily: "sans-serif", background: "white", color: "black", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
      <h2>Supabase Connection Status</h2>
      <p>{status}</p>
    </div>
  );
}
