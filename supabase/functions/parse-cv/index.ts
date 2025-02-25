
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
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing file or userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Mock CV parsing (replace with actual CV parsing logic)
    const mockParsedData = {
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
      careerHistory: [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          duration: '2020-2023'
        }
      ]
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Save parsed data to cv_parsed_data table
    const { error: upsertError } = await supabase
      .from('cv_parsed_data')
      .upsert({
        user_id: userId,
        skills: mockParsedData.skills,
        career_history: mockParsedData.careerHistory,
        cv_upload_date: new Date().toISOString()
      })

    if (upsertError) {
      throw upsertError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: mockParsedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
