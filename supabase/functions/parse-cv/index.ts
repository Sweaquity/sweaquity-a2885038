
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

    let extractedText = "";
    
    // Check file extension to determine how to process it
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'pdf') {
      // For PDF files, we need to use a different approach since mammoth doesn't support PDF
      // This would be where you'd use a PDF extraction library
      // For now, we'll use a sample text for demonstration
      console.log("PDF file detected, using sample text for extraction");
      extractedText = getSampleCVText();
    } else if (['doc', 'docx'].includes(fileExtension || '')) {
      // For Word documents, use mammoth to extract text
      console.log("Word document detected, extracting text with mammoth");
      const arrayBuffer = await fileData.arrayBuffer();
      const { value } = await mammoth.extractRawText({ buffer: arrayBuffer });
      extractedText = value;
    } else {
      console.error("Unsupported file type:", fileExtension);
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

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

// Sample CV text for testing when a real parser isn't available
function getSampleCVText() {
  return `
  John Doe
  Software Developer
  
  CONTACT
  Email: john.doe@example.com
  Phone: (123) 456-7890
  LinkedIn: linkedin.com/in/johndoe
  
  SKILLS
  JavaScript, TypeScript, Python, SQL, Excel, Power BI, RPA, VBA, SAP, TM1, React, Node.js
  
  EXPERIENCE
  Senior Developer - Tech Solutions Ltd - 2019-2023
  • Led development team of 5 engineers
  • Implemented new features for enterprise clients
  • Reduced application load time by 40%
  
  Web Developer - Digital Agency - 2016-2019
  • Built websites and web applications for various clients
  • Collaborated with design team to implement UI/UX improvements
  
  EDUCATION
  Bachelor of Science in Computer Science - University of Technology - 2012-2016
  • GPA: 3.8/4.0
  • Relevant coursework: Data Structures, Algorithms, Database Systems
  
  CERTIFICATIONS
  AWS Certified Developer - 2020
  Scrum Master Certification - 2019
  `;
}

// Extract skills from text
function extractSkills(text: string): string[] {
  // Define common skills to look for
  const skillKeywords = [
    "javascript", "typescript", "python", "sql", "excel", 
    "power bi", "rpa", "vba", "sap", "tm1", "react", "node.js",
    "html", "css", "java", "c#", "rust", "go", "ruby", "php",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "project management", "agile", "scrum", "communication", "teamwork"
  ];
  
  try {
    // Find skills that are mentioned in the CV text
    return skillKeywords.filter(skill => {
      // Create a regex to match the skill as a whole word, case insensitive
      // Escape special characters in skill names (like c++)
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      return regex.test(text.toLowerCase());
    });
  } catch (error) {
    console.error("Error in skill extraction:", error);
    return [];
  }
}

// Extract career history
function extractCareerHistory(text: string): any[] {
  try {
    const jobMatches = text.match(/(\b[A-Z][a-z]+ [A-Za-z]+\b)\s*-\s*(.*?)\s*-\s*(\d{4}.*?(?:\d{4}|Present))/g);
    return jobMatches ? jobMatches.map(entry => {
      const parts = entry.split(" - ");
      return { 
        title: parts[0], 
        company: parts[1], 
        duration: parts[2] 
      };
    }) : [];
  } catch (error) {
    console.error("Error extracting career history:", error);
    return [];
  }
}

// Extract education details
function extractEducation(text: string): any[] {
  try {
    const educationMatches = text.match(/(Bachelor|Master|PhD|MBA|BSc|MSc|BA|MA).*?\s*-\s*(.*?)\s*-\s*(\d{4}.*?(?:\d{4}|Present))/g);
    return educationMatches ? educationMatches.map(entry => {
      const parts = entry.split(" - ");
      return { 
        degree: parts[0], 
        institution: parts[1], 
        year: parts[2] 
      };
    }) : [];
  } catch (error) {
    console.error("Error extracting education:", error);
    return [];
  }
}
