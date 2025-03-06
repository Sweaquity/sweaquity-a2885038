
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, linkedInData } = await req.json()

    if (!userId || !linkedInData) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or linkedInData' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("Processing LinkedIn data import for user:", userId);
    
    // Extract skills from LinkedIn data
    let skills = [];
    
    try {
      if (linkedInData.skills && Array.isArray(linkedInData.skills)) {
        // Direct skills array
        skills = linkedInData.skills.map(skill => {
          // Handle different possible data structures
          if (typeof skill === 'string') {
            return { skill: skill, level: 'Intermediate' };
          } else if (skill && typeof skill === 'object') {
            const skillName = skill.name || skill.skill || '';
            const skillLevel = skill.level || 'Intermediate';
            return { skill: skillName, level: skillLevel };
          }
          return null;
        }).filter(Boolean); // Remove any null entries
      } else if (linkedInData.elements && Array.isArray(linkedInData.elements)) {
        // LinkedIn API response structure
        skills = linkedInData.elements
          .filter(item => item && item.name)
          .map(item => ({ 
            skill: item.name, 
            level: item.proficiency || 'Intermediate' 
          }));
      }
    } catch (parseError) {
      console.error("Error parsing LinkedIn skills:", parseError);
      return new Response(
        JSON.stringify({ error: 'Error parsing LinkedIn skills data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (skills.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No skills found in LinkedIn data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Found ${skills.length} skills from LinkedIn data`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get existing profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Merge with existing skills if any
    let updatedSkills = skills;
    
    if (profileData && profileData.skills) {
      const existingSkills = Array.isArray(profileData.skills) 
        ? profileData.skills 
        : (typeof profileData.skills === 'object' ? Object.values(profileData.skills) : []);
      
      // Create a set of existing skill names for faster lookup
      const existingSkillNames = new Set(
        existingSkills.map(s => 
          typeof s === 'string' ? s.toLowerCase() : (s.skill || '').toLowerCase()
        ).filter(Boolean)
      );
      
      // Only add LinkedIn skills that don't already exist
      const newSkills = skills.filter(skill => 
        !existingSkillNames.has((skill.skill || '').toLowerCase())
      );
      
      updatedSkills = [...existingSkills, ...newSkills];
      console.log(`Adding ${newSkills.length} new skills to ${existingSkills.length} existing skills`);
    }

    // Update profile with merged skills
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        skills: updatedSkills,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile with LinkedIn skills:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${skills.length} skills from LinkedIn`,
        skills: updatedSkills
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in linkedin-skills-import function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
