import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import mammoth from "https://esm.sh/mammoth@1.4.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const cvUrl = formData.get('cvUrl') as string;

    if (!userId || !cvUrl) {
      return new Response(JSON.stringify({ error: 'Missing userId or cvUrl' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Processing CV for user:", userId);
    console.log("CV URL:", cvUrl);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract the correct file path from the public URL
    const urlParts = new URL(cvUrl);
    let filePath = urlParts.pathname.replace("/storage/v1/object/public/", "");
    
    // Debugging logs
    console.log("Original cvUrl:", cvUrl);
    console.log("Extracted filePath:", filePath);
    
    // Ensure the filePath does not contain bucket name (cvs/cvs issue)
    if (filePath.startsWith("cvs/")) {
      filePath = filePath.replace("cvs/", "");
    }
    
    console.log("Final filePath for download:", filePath);
    
    // Download the CV file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase
      .storage.from('cvs')  // Ensure this matches your actual bucket name
      .download(filePath);
    
    if (downloadError) {
      console.error("Error downloading CV:", downloadError);
      return new Response(JSON.stringify({ error: 'Error downloading CV', details: downloadError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Convert file blob to ArrayBuffer and extract text using Mammoth
    const arrayBuffer = await fileData.arrayBuffer();
    const { value: extractedText } = await mammoth.extractRawText({ buffer: arrayBuffer });

    console.log("Extracted text from CV:", extractedText.substring(0, 500)); // Log first 500 chars

    // Extract data from CV text
    const skills = extractSkills(extractedText);
    const careerHistory = extractCareerHistory(extractedText);
    const education = extractEducation(extractedText);

    console.log(`Extracted ${skills.length} skills, ${careerHistory.length} jobs, ${education.length} education entries`);

    // Save parsed data to Supabase
    const { error: upsertError } = await supabase.from('cv_parsed_data').upsert({
      user_id: userId,
      skills,
      career_history: careerHistory,
      education,
      cv_url: cvUrl,
      cv_upload_date: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("Error saving parsed CV data:", upsertError);
      throw upsertError;
    }

    return new Response(JSON.stringify({ success: true, data: { skills, careerHistory, education } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in parse-cv function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Extract skills from text
function extractSkills(text: string): string[] {
  const skillKeywords = ["javascript", "typescript", "python", "sql", "excel", "power bi", "rpa", "vba", "sap", "tm1"];
  return skillKeywords.filter(skill => text.toLowerCase().includes(skill));
}

// Extract career history
function extractCareerHistory(text: string): any[] {
  const jobMatches = text.match(/(\b[A-Z][a-z]+ [A-Z][a-z]+\b)\s*-\s*(.*)\s*-\s*(\d{4}.*\d{4}|Present)/g);
  return jobMatches ? jobMatches.map(entry => {
    const parts = entry.split(" - ");
    return { title: parts[0], company: parts[1], duration: parts[2] };
  }) : [];
}

// Extract education details
function extractEducation(text: string): any[] {
  const educationMatches = text.match(/(Bachelor|Master|PhD|MBA).*?\s*-\s*(.*)\s*-\s*(\d{4}.*\d{4}|Present)/g);
  return educationMatches ? educationMatches.map(entry => {
    const parts = entry.split(" - ");
    return { degree: parts[0], institution: parts[1], year: parts[2] };
  }) : [];
}
