import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { readDocx } from "https://esm.sh/docx-wasm@1.0.0";

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const urlParts = new URL(cvUrl);
    let filePath = urlParts.pathname.replace("/storage/v1/object/public/", "");

    console.log("Extracted filePath:", filePath);

    if (filePath.startsWith("cvs/")) {
      filePath = filePath.replace("cvs/", "");
    }

    console.log("Final filePath for download:", filePath);

    const { data: fileData, error: downloadError } = await supabase
      .storage.from('cvs')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Error downloading CV:", downloadError);
      return new Response(JSON.stringify({ error: 'Error downloading CV' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log("File successfully downloaded. File size:", fileData.size);

    const arrayBuffer = await fileData.arrayBuffer();
    console.log("Converted file to ArrayBuffer. Size:", arrayBuffer.byteLength);

    let extractedText = "";
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    if (["doc", "docx"].includes(fileExtension || "")) {
      console.log("Attempting to extract text with docx-wasm...");
      try {
        extractedText = await readDocx(arrayBuffer);
        console.log("Extraction complete. Extracted text length:", extractedText.length);
      } catch (wasmError) {
        console.error("docx-wasm extraction failed:", wasmError);
        return new Response(JSON.stringify({ error: "docx-wasm extraction failed", details: wasmError.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    } else {
      console.error("Unsupported file type:", fileExtension);
      return new Response(JSON.stringify({ error: "Unsupported file type (Only .docx allowed)" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Extracted text from CV (first 500 chars):", extractedText.substring(0, 500));

    const skills = extractSkills(extractedText);
    const careerHistory = extractCareerHistory(extractedText);
    const education = extractEducation(extractedText);

    console.log(`Extracted ${skills.length} skills, ${careerHistory.length} jobs, ${education.length} education entries`);

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

function extractSkills(text: string): string[] {
  const skillKeywords = [
    "javascript", "typescript", "python", "sql", "excel", "power bi", "rpa", "vba", "sap", "tm1",
    "react", "node.js", "html", "css", "java", "c#", "rust", "go", "ruby", "php",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "project management", "agile", "scrum", "communication", "teamwork"
  ];
  return skillKeywords.filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(text));
}

function extractCareerHistory(text: string): any[] {
  const jobMatches = text.match(/(\b[A-Z][a-z]+ [A-Za-z]+\b)\s*-\s*(.*?)\s*-\s*(\d{4}.*?(?:\d{4}|Present))/g);
  return jobMatches ? jobMatches.map(entry => {
    const parts = entry.split(" - ");
    return { title: parts[0], company: parts[1], duration: parts[2] };
  }) : [];
}

function extractEducation(text: string): any[] {
  const educationMatches = text.match(/(Bachelor|Master|PhD|MBA|BSc|MSc|BA|MA).*?\s*-\s*(.*?)\s*-\s*(\d{4}.*?(?:\d{4}|Present))/g);
  return educationMatches ? educationMatches.map(entry => {
    const parts = entry.split(" - ");
    return { degree: parts[0], institution: parts[1], year: parts[2] };
  }) : [];
}
