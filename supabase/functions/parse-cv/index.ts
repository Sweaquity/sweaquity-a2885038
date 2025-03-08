import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Extract the file path from the URL
    const urlParts = new URL(cvUrl);
    let filePath = urlParts.pathname.replace("/storage/v1/object/public/", "");

    console.log("Extracted filePath:", filePath);

    if (filePath.startsWith("cvs/")) {
      filePath = filePath.replace("cvs/", "");
    }

    console.log("Final filePath for download:", filePath);

    // Download the file from Supabase Storage
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

    let extractedText = "";
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    if (fileExtension === "docx") {
      console.log("Word DOCX document detected, extracting text with mammoth");
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      
      console.log("Full extracted text length:", extractedText.length);
      console.log("First 500 chars:", extractedText.substring(0, 500));
    } 
    else if (fileExtension === "doc") {
      console.log("Word DOC document detected, using alternative parsing method");
      try {
        // Attempt to use mammoth for .doc files
        const arrayBuffer = await fileData.arrayBuffer();
        const result = await convertDocToText(arrayBuffer);
        extractedText = result;
      } catch (docError) {
        console.error("Error parsing .doc file:", docError);
        return new Response(JSON.stringify({ error: 'Error parsing .doc file format. Please convert to DOCX format for better compatibility.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }
    else if (fileExtension === "pdf") {
      console.log("PDF document detected - PDF processing is disabled");
      return new Response(JSON.stringify({ 
        error: 'PDF processing is currently disabled. Please upload your CV in DOCX format.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    } else {
      console.error("Unsupported file type:", fileExtension);
      return new Response(JSON.stringify({ error: `Unsupported file type: ${fileExtension}. Please upload your CV in DOCX format.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Extract information from the CV using the comprehensive extractors
    const skills = extractSkills(extractedText);
    const careerHistory = extractCareerHistory(extractedText);
    const education = extractEducation(extractedText);

    // Log the extracted data for verification
    console.log("Extracted skills:", JSON.stringify(skills));
    console.log(`Extracted ${skills.length} skills, ${careerHistory.length} jobs, ${education.length} education entries`);

    // Save the parsed data to Supabase
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

    // Get existing profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', userId)
      .single();

    if (!profileError) {
      // Convert skills to the format used in profiles
      const formattedSkills = skills.map(skill => ({
        skill: skill,
        level: "Intermediate" // Default to intermediate for CV-extracted skills
      }));
      
      // Merge with existing skills if any
      let updatedSkills = formattedSkills;
      
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
        
        // Only add CV skills that don't already exist
        const newSkills = formattedSkills.filter(skill => 
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
        console.error("Error updating profile with CV skills:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          skills,
          careerHistory,
          education,
          fileType: fileExtension
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in parse-cv function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Function to handle .doc files (Word 97-2003)
async function convertDocToText(arrayBuffer) {
  // Attempt to use mammoth with basic options
  try {
    // Try the standard mammoth extraction method first
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (e) {
    console.error("Standard mammoth extraction failed for .doc file", e);
    
    // If the standard method fails, try a more permissive approach
    try {
      // Some versions of mammoth support options for legacy formats
      const result = await mammoth.extractRawText({ 
        arrayBuffer,
        // Using ignore errors option to be more permissive
        options: { ignoreEmptyParagraphs: true }
      });
      return result.value;
    } catch (innerError) {
      console.error("Alternative .doc extraction failed:", innerError);
      throw new Error("Unable to parse .DOC format. Please convert to DOCX format.");
    }
  }
}

function extractSkills(text: string): string[] {
  // Enhanced skill extraction with more comprehensive list and contextual understanding
  const textLower = text.toLowerCase();
  
  // Define skill categories with related terms
  const skillCategories = {
    // Programming Languages
    programmingLanguages: [
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 
      'golang', ' rust', 'scala', 'perl', 'haskell', 'dart', ' r', 'matlab'
    ],
    // Web Technologies
    webTech: [
      'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'next.js', 'gatsby',
      'jquery', 'bootstrap', 'tailwind', 'material-ui', 'webpack', 'graphql', 'apollo', 'redux',
      'svelte', 'ember', 'backbone', 'sass', 'less', 'styled-components', 'pwa'
    ],
    // Databases
    databases: [
      'mongodb', 'sql', 'postgresql', 'mysql', 'oracle', 'redis', 'elasticsearch',
      'mariadb', 'sqlite', 'dynamodb', 'cassandra', 'couchdb', 'firebase', 'supabase'
    ],
    // Cloud & DevOps
    cloudDevOps: [
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
      'gitlab ci', 'github actions', 'travis ci', 'circle ci', 'ansible', 'chef', 'puppet',
      'prometheus', 'grafana', 'istio', 'envoy', 'consul'
    ],
    // Version Control
    versionControl: [
      'git', 'github', 'gitlab', 'bitbucket', 'mercurial', 'svn'
    ],
    // Project Management
    projectManagement: [
      'agile', 'scrum', 'kanban', 'jira', 'trello', 'asana', 'basecamp', 'monday',
      'waterfall', 'prince2', 'pmp', 'lean', 'six sigma'
    ],
    // Design
    design: [
      'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd', 'indesign', 'ui design',
      'ux design', 'user research', 'wireframing', 'prototyping'
    ],
    // Mobile Development
    mobileDev: [
      'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
      'objective-c', 'swift ui', 'kotlin multiplatform', 'jetpack compose'
    ],
    // Data Science & AI
    dataScience: [
      'machine learning', 'deep learning', 'natural language processing', 'computer vision',
      'data mining', 'data visualization', 'statistical analysis', 'tensorflow', 'pytorch',
      'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv', 'spacy', 'nltk'
    ],
    // Business & Soft Skills
    businessSkills: [
      'leadership', 'leadershing', 'communication', 'communicating', 'teamwork', 'problem solving', 'critical thinking',
      'time management', 'managing teams', 'negotiation', 'negotiating', 'presentation', 'presentating', 'public speaking', 'stakeholder management',
      'managing stakeholders', 'business development', 'sales', 'marketing', 'finance', 'accounting', 'hr', 'human resourses'
    ]
  };

  // Flatten the categories into one array for initial search
  const allSkills = Object.values(skillCategories).flat();

  // Look for direct mentions
  const foundSkills = new Set<string>();
  
  allSkills.forEach(skill => {
    try {
      // Escape special regex characters in the skill name
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Create a regex to match the skill as a whole word
      const wordBoundaryRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      
      if (wordBoundaryRegex.test(textLower)) {
        foundSkills.add(skill);
      }
    } catch (error) {
      console.error(`Error creating regex for skill '${skill}':`, error);
      // Try a simple string match as fallback
      if (textLower.includes(skill)) {
        foundSkills.add(skill);
      }
    }
  });
  
  // Look for contextual mentions (skills with additional words)
  const contextualIndicators = [
    'proficient in', 'skilled in', 'experienced with', 'knowledge of', 'expertise in',
    'familiar with', 'worked with', 'developed with', 'using', 'utilized', 'implemented', 'achievements', 'achieved'
  ];
  
  contextualIndicators.forEach(indicator => {
    const indicatorPos = textLower.indexOf(indicator);
    if (indicatorPos !== -1) {
      // Look at the text following the indicator
      const followingText = textLower.substring(indicatorPos + indicator.length, indicatorPos + indicator.length + 100);
      allSkills.forEach(skill => {
        if (followingText.includes(skill)) {
          foundSkills.add(skill);
        }
      });
    }
  });
  
  // Add skills from skill sections (where "Skills" is mentioned)
  const skillSectionMatch = text.match(/skills[:\s]*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (skillSectionMatch && skillSectionMatch[1]) {
    const skillSection = skillSectionMatch[1].toLowerCase();
    allSkills.forEach(skill => {
      if (skillSection.includes(skill)) {
        foundSkills.add(skill);
      }
    });
  }

  // Add frameworks and libraries based on language mentions
  // For instance, if "JavaScript" is found, we might infer React, Angular, etc.
  const frameworkAssociations: Record<string, string[]> = {
    'javascript': ['react', 'angular', 'vue', 'node.js', 'express'],
    'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
    'java': ['spring', 'hibernate', 'junit', 'maven', 'gradle'],
    'c#': ['asp.net', '.net core', 'xamarin', 'unity'],
    'php': ['laravel', 'symfony', 'wordpress', 'drupal']
  };
  
  // For each language found, check if frameworks are mentioned
  foundSkills.forEach(skill => {
    const frameworks = frameworkAssociations[skill];
    if (frameworks) {
      frameworks.forEach(framework => {
        if (textLower.includes(framework)) {
          foundSkills.add(framework);
        }
      });
    }
  });

  return Array.from(foundSkills);
}

function extractCareerHistory(text: string): any[] {
  const careerHistory = [];
  const lines = text.split('\n');
  let currentRole: any = {};
  let inJobSection = false;
  
  // Common job title keywords
  const jobTitleKeywords = [
    'engineer', 'developer', 'manager', 'director', 'lead', 'architect', 'consultant',
    'specialist', 'analyst', 'coordinator', 'associate', 'executive', 'administrator',
    'designer', 'researcher', 'officer', 'supervisor', 'head of', 'chief', 'vp',
    'president', 'founder', 'co-founder', 'intern', 'assistant'
  ];
  
  // Look for a work experience section
  const workExperienceHeaders = [
    'work experience', 'professional experience', 'employment history', 
    'career history', 'experience', 'employment', 'work history', 'career summary'
  ];

  // Regex patterns for dates
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*present\b/i,
    /\b\d{4}\s*(-|–|to)\s*\d{4}\b/,
    /\b\d{4}\s*(-|–|to)\s*present\b/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if we're entering a work experience section
    if (!inJobSection) {
      const lowerLine = line.toLowerCase();
      if (workExperienceHeaders.some(header => lowerLine.includes(header))) {
        inJobSection = true;
        continue;
      }
    }
    
    // Look for date patterns that often indicate job entries
    const hasDatePattern = datePatterns.some(pattern => pattern.test(line));
    
    // Look for lines that might contain job titles
    const isJobTitle = jobTitleKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    );
    
    if ((isJobTitle || hasDatePattern) && (inJobSection || !currentRole.title)) {
      // If we've collected information about a previous role, save it
      if (currentRole.title && (currentRole.company || currentRole.duration)) {
        careerHistory.push({...currentRole});
        currentRole = {};
      }
      
      // Start a new role
      if (isJobTitle) {
        currentRole.title = line;
      }
      
      // Look for company name in the surrounding lines
      for (let j = Math.max(0, i - 1); j <= Math.min(i + 1, lines.length - 1); j++) {
        const nearbyLine = lines[j].trim();
        if (j !== i && nearbyLine && !jobTitleKeywords.some(kw => nearbyLine.toLowerCase().includes(kw)) && !datePatterns.some(p => p.test(nearbyLine))) {
          currentRole.company = nearbyLine;
          break;
        }
      }
      
      // Look for dates
      if (hasDatePattern) {
        currentRole.duration = line;
      } else {
        // Look for dates in the surrounding lines
        for (let j = Math.max(0, i - 1); j <= Math.min(i + 2, lines.length - 1); j++) {
          const dateLine = lines[j].trim();
          if (datePatterns.some(p => p.test(dateLine))) {
            currentRole.duration = dateLine;
            break;
          }
        }
      }
      
      // Look for job description in the following lines
      let description = '';
      let k = i + 1;
      while (k < lines.length && lines[k].trim() && !jobTitleKeywords.some(kw => lines[k].toLowerCase().includes(kw)) && !datePatterns.some(p => p.test(lines[k]))) {
        description += lines[k].trim() + ' ';
        k++;
      }
      if (description) {
        currentRole.description = description.trim();
      }
    }
  }
  
  // Add the last role if any
  if (currentRole.title && (currentRole.company || currentRole.duration)) {
    careerHistory.push({...currentRole});
  }

  return careerHistory;
}

function extractEducation(text: string): any[] {
  const education = [];
  const lines = text.split('\n');
  let currentEducation: any = {};
  let inEducationSection = false;
  
  // Education keywords
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'mba', 'bsc', 'ba', 'ma', 'ms', 'msc',
    'degree', 'diploma', 'certificate', 'certification', 'university', 'college', 'school',
    'institute', 'academy'
  ];
  
  // Education section headers
  const educationHeaders = [
    'education', 'academic background', 'qualifications', 'academic qualifications',
    'educational background', 'academic history'
  ];
  
  // Date patterns
  const datePatterns = [
    /\b\d{4}\s*(-|–|to)\s*\d{4}\b/,
    /\b\d{4}\s*(-|–|to)\s*present\b/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if we're entering an education section
    if (!inEducationSection) {
      const lowerLine = line.toLowerCase();
      if (educationHeaders.some(header => lowerLine.includes(header))) {
        inEducationSection = true;
        continue;
      }
    }
    
    // Look for lines containing education keywords
    const isEducationLine = educationKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    );
    
    const hasDatePattern = datePatterns.some(pattern => pattern.test(line));
    
    if ((isEducationLine || hasDatePattern) && (inEducationSection || !currentEducation.degree)) {
      // If we've collected information about previous education, save it
      if (currentEducation.degree && (currentEducation.institution || currentEducation.year)) {
        education.push({...currentEducation});
        currentEducation = {};
      }
      
      // Extract degree and institution
      if (isEducationLine) {
        // Try to separate degree and institution
        const parts = line.split(/,|\sat\s|\sfrom\s/);
        if (parts.length > 1) {
          currentEducation.degree = parts[0].trim();
          currentEducation.institution = parts[1].trim();
        } else {
          currentEducation.degree = line;
        }
      }
      
      // Look for years
      if (hasDatePattern) {
        currentEducation.year = line;
      } else {
        // Look for dates in the surrounding lines
        for (let j = Math.max(0, i - 1); j <= Math.min(i + 1, lines.length - 1); j++) {
          const dateLine = lines[j].trim();
          if (datePatterns.some(p => p.test(dateLine))) {
            currentEducation.year = dateLine;
            break;
          }
        }
      }
    }
  }
  
  // Add the last education entry if any
  if (currentEducation.degree && (currentEducation.institution || currentEducation.year)) {
    education.push({...currentEducation});
  }

  return education;
}
