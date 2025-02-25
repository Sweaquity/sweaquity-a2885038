
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { extractPDFText } from "https://deno.land/x/pdf_extract@v1.1.1/mod.ts";

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

    // Extract text from PDF
    let text = '';
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractPDFText(new Uint8Array(arrayBuffer));
    } else {
      // For other file types, you might want to implement different parsers
      text = await file.text();
    }

    // Basic parsing logic - you might want to enhance this
    const skills = extractSkills(text);
    const careerHistory = extractCareerHistory(text);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Save parsed data to cv_parsed_data table
    const { error: upsertError } = await supabase
      .from('cv_parsed_data')
      .upsert({
        user_id: userId,
        skills: skills,
        career_history: careerHistory,
        cv_upload_date: new Date().toISOString()
      })

    if (upsertError) {
      throw upsertError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          skills,
          careerHistory
        }
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

function extractSkills(text: string): string[] {
  // Basic skill extraction - you might want to enhance this
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'sql', 'postgresql', 'mysql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'agile', 'scrum', 'project management'
  ];

  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return Array.from(new Set(foundSkills));
}

function extractCareerHistory(text: string): any[] {
  // Basic career history extraction - you might want to enhance this
  const careerHistory = [];
  const lines = text.split('\n');
  let currentRole: any = {};

  for (const line of lines) {
    if (line.toLowerCase().includes('experience') || line.toLowerCase().includes('work history')) {
      continue;
    }

    // Look for possible job titles and companies
    if (line.match(/^[A-Z][a-zA-Z\s]{2,}/) && !currentRole.title) {
      currentRole.title = line.trim();
    } else if (line.match(/^[A-Z][a-zA-Z\s]{2,}/) && !currentRole.company) {
      currentRole.company = line.trim();
    } else if (line.match(/\d{4}/) && !currentRole.duration) {
      currentRole.duration = line.trim();
      if (Object.keys(currentRole).length >= 2) {
        careerHistory.push({...currentRole});
        currentRole = {};
      }
    }
  }

  return careerHistory;
}
