
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestData = await req.json();
    const { user_id } = requestData;

    if (!user_id) {
      console.error("Missing user_id in request");
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Received request for user_id:", user_id);

    // Initialize Supabase client with service role to access auth data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log if credentials are missing
    if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get user auth data to check for LinkedIn provider
    const { data: userData, error: userError } = await supabaseAdmin.auth
      .admin.getUserById(user_id);

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("User found:", userData.user.id);

    // For demonstration purposes - return mock skills
    // In a real implementation, you would use the LinkedIn API
    const mockSkills = [
      "JavaScript",
      "React",
      "TypeScript",
      "Node.js",
      "HTML",
      "CSS",
      "SQL",
      "Project Management",
      "Team Leadership",
      "Communication",
      "Problem Solving",
    ];
    
    // Randomly select 5-8 skills to simulate a real LinkedIn profile
    const selectedSkills = [];
    const numberOfSkills = 5 + Math.floor(Math.random() * 4); // Between 5 and 8 skills
    
    const availableSkills = [...mockSkills]; // Create a copy to avoid modifying the original
    for (let i = 0; i < numberOfSkills; i++) {
      if (availableSkills.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availableSkills.length);
      const skill = availableSkills.splice(randomIndex, 1)[0];
      if (skill) selectedSkills.push(skill);
    }

    console.log("Returning skills:", selectedSkills);

    return new Response(
      JSON.stringify({ 
        success: true, 
        skills: selectedSkills 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
