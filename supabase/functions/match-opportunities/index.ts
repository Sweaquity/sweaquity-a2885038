
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's skills from parsed CV data
    const { data: userData, error: userError } = await supabase
      .from('cv_parsed_data')
      .select('skills')
      .eq('user_id', userId)
      .single()

    if (userError) throw userError

    const userSkills = userData?.skills || []

    // Get all available business roles
    const { data: roles, error: rolesError } = await supabase
      .from('business_roles')
      .select('*')
      .eq('open_to_recruiters', true)

    if (rolesError) throw rolesError

    // Simple matching algorithm based on skills
    const matchedRoles = roles
      .map(role => {
        const requiredSkills = role.required_skills || []
        const matchingSkills = userSkills.filter(skill => 
          requiredSkills.includes(skill.toLowerCase())
        )
        const matchScore = matchingSkills.length / requiredSkills.length

        return {
          ...role,
          matchScore,
          matchingSkills
        }
      })
      .filter(role => role.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)

    return new Response(
      JSON.stringify({ 
        matches: matchedRoles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in match-opportunities function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
