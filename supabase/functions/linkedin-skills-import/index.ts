
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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Supabase client with service role to access auth data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // Check if user has LinkedIn identity
    const linkedInIdentity = userData.user.identities?.find(
      id => id.provider === "linkedin_oidc"
    );

    if (!linkedInIdentity) {
      return new Response(
        JSON.stringify({ error: "No LinkedIn account connected" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // For the sake of demonstrating functionality, we'll return some mock skills
    // In a real implementation, you would use the LinkedIn API with the access token
    // stored in the identity.identity_data
    
    // Mock skills based on common LinkedIn skills
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
    
    for (let i = 0; i < numberOfSkills; i++) {
      const randomIndex = Math.floor(Math.random() * mockSkills.length);
      const skill = mockSkills.splice(randomIndex, 1)[0];
      if (skill) selectedSkills.push(skill);
      if (mockSkills.length === 0) break;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        skills: selectedSkills 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
    /* 
    // In a real implementation, you would use the LinkedIn API
    // to fetch the user's skills using their access token
    
    const accessToken = linkedInIdentity.identity_data.access_token;
    
    const response = await fetch("https://api.linkedin.com/v2/me?projection=(skills)", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    const linkedInData = await response.json();
    const skills = linkedInData.skills.map(skillObj => skillObj.skill.name);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        skills: skills 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    */
    
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
