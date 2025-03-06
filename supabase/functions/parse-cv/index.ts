
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

    // For now, we'll implement a basic text extraction
    let text = '';
    try {
      // Convert file to text
      text = await file.text();
    } catch (error) {
      text = ''; // Default to empty string if extraction fails
    }

    // Extract skills and career history from text
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractSkills(text: string): string[] {
  // Improved skill extraction with more comprehensive list
  const commonSkills = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    // Web Technologies
    'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'next.js', 'gatsby',
    // Databases
    'mongodb', 'sql', 'postgresql', 'mysql', 'oracle', 'redis', 'elasticsearch',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
    // Version Control
    'git', 'github', 'gitlab', 'bitbucket',
    // Project Management
    'agile', 'scrum', 'kanban', 'jira', 'trello',
    // General Skills
    'project management', 'team leadership', 'communication', 'problem solving'
  ];

  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return Array.from(new Set(foundSkills));
}

function extractCareerHistory(text: string): any[] {
  const careerHistory = [];
  const lines = text.split('\n');
  let currentRole: any = {};
  
  // Common job title keywords
  const jobTitleKeywords = ['engineer', 'developer', 'manager', 'director', 'lead', 'architect', 'consultant'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for lines that might contain job titles
    const isJobTitle = jobTitleKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    );
    
    if (isJobTitle && !currentRole.title) {
      currentRole.title = line;
      
      // Look for company name in the next line
      if (i + 1 < lines.length) {
        currentRole.company = lines[i + 1].trim();
      }
      
      // Look for dates in the surrounding lines
      for (let j = i - 1; j <= i + 2; j++) {
        if (j >= 0 && j < lines.length) {
          const dateLine = lines[j].trim();
          if (dateLine.match(/\d{4}/)) {
            currentRole.duration = dateLine;
            break;
          }
        }
      }
      
      if (currentRole.title && (currentRole.company || currentRole.duration)) {
        careerHistory.push({...currentRole});
        currentRole = {};
      }
    }
  }

  return careerHistory;
}
