import { NextResponse } from "next/server";
import { SupabaseInventoryClientService } from "@/lib/supabase/inventory-client";
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log("🔍 Testing Supabase connection...");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("Environment variables:", {
      url: supabaseUrl || "Not set",
      anonKey: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "Not set",
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set"
    });

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase environment variables",
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 500 });
    }

    // Test direct connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("🔍 Testing direct Supabase query...");
    const { data, error, count } = await supabase
      .from('suppliers')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Direct query error:", error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log("✅ Direct query successful, count:", count);

    // Test service method
    const result = await SupabaseInventoryClientService.testConnection();
    console.log("✅ Service test result:", result);
    
    return NextResponse.json({
      success: true,
      direct_query_count: count,
      service_result: result
    });
    
  } catch (error) {
    console.error("❌ Supabase connection test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : error
      }, 
      { status: 500 }
    );
  }
}