
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
    const formData = await req.formData()
    const file = formData.get('file')
    const userId = formData.get('userId')

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: 'File and user ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For this example, we'll use a simple parsing logic
    // In a production environment, you'd want to use a proper CV parsing service
    const text = await file.text()
    
    // Simple parsing logic (you'd want to use a more sophisticated approach)
    const skills = extractSkills(text)
    const careerHistory = extractCareerHistory(text)

    // Store parsed data
    const { error: parseError } = await supabase
      .from('cv_parsed_data')
      .upsert({
        user_id: userId,
        skills: skills,
        career_history: careerHistory,
        last_updated: new Date().toISOString()
      })

    if (parseError) {
      throw parseError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { skills, careerHistory } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in parse-cv function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Simple skill extraction (you'd want to use a more sophisticated approach)
function extractSkills(text: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node', 'express', 'sql', 'nosql', 'mongodb', 'aws', 'azure', 'docker',
    'kubernetes', 'ci/cd', 'agile', 'scrum'
  ]
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
}

// Simple career history extraction (you'd want to use a more sophisticated approach)
function extractCareerHistory(text: string): any[] {
  const lines = text.split('\n')
  const history = []
  let currentPosition = null

  for (const line of lines) {
    if (line.toLowerCase().includes('experience') || 
        line.toLowerCase().includes('work history')) {
      currentPosition = {}
    } else if (currentPosition && line.trim()) {
      if (!currentPosition.title) {
        currentPosition.title = line.trim()
      } else if (!currentPosition.company) {
        currentPosition.company = line.trim()
        history.push(currentPosition)
        currentPosition = null
      }
    }
  }

  return history
}
