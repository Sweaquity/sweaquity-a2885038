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

    // Check file extension before downloading
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    
    // Only allow DOCX files
    if (fileExtension !== "docx") {
      return new Response(JSON.stringify({ 
        error: 'Only DOCX files are supported. Please convert your document to DOCX format.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

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

    // Process DOCX file with mammoth
    console.log("Word DOCX document detected, extracting text with mammoth");
    let extractedText = "";
    
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      
      console.log("Full extracted text length:", extractedText.length);
      console.log("First 500 chars:", extractedText.substring(0, 500));
    } catch (extractError) {
      console.error("Error extracting text from DOCX:", extractError);
      return new Response(JSON.stringify({ error: 'Error parsing document content. Please ensure the DOCX file is not corrupted.' }), {
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

function extractSkills(text: string): string[] {
  // Enhanced skill extraction with more comprehensive list and contextual understanding
  const textLower = text.toLowerCase();
  
  // Define skill categories with related terms
  const skillCategories = {
   const skillCategories = {
    // Programming Languages
    programmingLanguages: [
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 
      'golang', 'go', 'rust', 'scala', 'perl', 'haskell', 'dart', 'r', 'matlab', 'fortran', 'cobol',
      'assembly', 'objective-c', 'lua', 'clojure', 'groovy', 'powershell', 'bash', 'shell', 'vba',
      'lisp', 'delphi', 'abap', 'apex', 'crystal', 'erlang', 'f#', 'ocaml', 'solidity', 'elm'
    ],
    // Web Technologies
    webTech: [
      'html', 'css', 'html5', 'css3', 'react', 'angular', 'vue', 'node.js', 'express', 'next.js', 'gatsby',
      'jquery', 'bootstrap', 'tailwind', 'material-ui', 'mui', 'webpack', 'graphql', 'apollo', 'redux',
      'svelte', 'ember', 'backbone', 'sass', 'less', 'styled-components', 'pwa', 'jamstack', 'storybook',
      'parcel', 'rollup', 'vite', 'astro', 'webgl', 'three.js', 'web components', 'web assembly', 'wasm',
      'axios', 'fetch api', 'websockets', 'service workers', 'pwa', 'ssr', 'ssg', 'csr', 'oauth',
      'jwt', 'web accessibility', 'responsive design', 'web security', 'cors', 'rest api', 'restful',
      'seo', 'amp', 'babel', 'handlebars', 'ejs', 'pug', 'jade', 'nuxt.js', 'remix', 'webpack 5',
      'json', 'xml', 'yaml', 'markdown', 'tailwindcss', 'bulma', 'chakra ui', 'ant design', 'radix ui'
    ],
    // Databases
    databases: [
      'mongodb', 'sql', 'postgresql', 'mysql', 'oracle', 'redis', 'elasticsearch',
      'mariadb', 'sqlite', 'dynamodb', 'cassandra', 'couchdb', 'firebase', 'supabase',
      'neo4j', 'graphdb', 'influxdb', 'timescaledb', 'cosmosdb', 'cockroachdb', 'mssql',
      'sql server', 'bigtable', 'firestore', 'realm', 'objectbox', 'couchbase', 'rethinkdb',
      'snowflake', 'clickhouse', 'bigtable', 'hbase', 'nosql', 'jdbc', 'jpa', 'hibernate',
      'sequelize', 'prisma', 'typeorm', 'mongoose', 'database design', 'data modeling',
      'database administration', 'dba', 'planetscale', 'database optimization', 'database migration'
    ],
    // Cloud & DevOps
    cloudDevOps: [
      'aws', 'azure', 'gcp', 'google cloud', 'cloud computing', 'docker', 'kubernetes', 'k8s', 'jenkins', 'terraform',
      'gitlab ci', 'github actions', 'travis ci', 'circle ci', 'ansible', 'chef', 'puppet',
      'prometheus', 'grafana', 'istio', 'envoy', 'consul', 'vault', 'nomad', 'pulumi', 'cloudformation',
      'serverless', 'lambda', 'azure functions', 'cloud functions', 'heroku', 'digital ocean', 'linode',
      'vercel', 'netlify', 'aws amplify', 'cloudflare', 'cdn', 'ci/cd', 'continuous integration', 'continuous delivery',
      'infrastructure as code', 'iac', 'site reliability engineering', 'sre', 'devops', 'devsecops', 'gitops',
      'platform engineering', 'argocd', 'aws ec2', 's3', 'rds', 'vpc', 'aws iam', 'aws cloudfront',
      'aws lambda', 'azure vm', 'azure storage', 'gcp compute engine', 'gcp big query', 'cloud storage',
      'service mesh', 'logging', 'monitoring', 'observability', 'chaos engineering', 'container orchestration',
      'helm', 'openshift', 'rancher', 'cloud native'
    ],
    // Version Control
    versionControl: [
      'git', 'github', 'gitlab', 'bitbucket', 'mercurial', 'svn', 'subversion', 'cvs',
      'perforce', 'azure devops', 'tfs', 'version control', 'source control', 'gitflow',
      'trunk based development', 'merge', 'rebase', 'branch', 'commit', 'pull request', 'code review'
    ],
    // Project Management
    projectManagement: [
      'agile', 'scrum', 'kanban', 'jira', 'trello', 'asana', 'basecamp', 'monday',
      'waterfall', 'prince2', 'pmp', 'lean', 'six sigma', 'itil', 'pmbok', 'product management',
      'product owner', 'project manager', 'scrum master', 'sprint planning', 'retrospective', 'daily standup',
      'okrs', 'kpis', 'requirements gathering', 'user stories', 'epics', 'roadmap', 'sprint', 'backlog',
      'confluence', 'notion', 'smartsheet', 'project planning', 'resource allocation', 'gantt chart',
      'risk management', 'stakeholder management', 'delivery management', 'clickup', 'linear', 'aha',
      'project scheduling', 'wrike', 'atlassian', 'program management', 'portfolio management'
    ],
    // Design
    design: [
      'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd', 'indesign', 'ui design',
      'ux design', 'user research', 'wireframing', 'prototyping', 'graphic design', 'visual design',
      'interaction design', 'user interface', 'user experience', 'usability testing', 'a/b testing',
      'product design', 'web design', 'mobile design', 'responsive design', 'accessibility', 'wcag',
      'typography', 'color theory', 'design systems', 'design thinking', 'information architecture',
      'user journey', 'user flow', 'persona', 'storyboarding', 'adobe creative suite', 'zeplin',
      'invision', 'principle', 'framer', 'after effects', 'motion design', 'animation',
      'design tokens', 'atomic design', 'affinity designer', 'procreate', 'blender', 'cinema 4d'
    ],
    // Mobile Development
    mobileDev: [
      'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
      'objective-c', 'swift ui', 'kotlin multiplatform', 'jetpack compose', 'android studio',
      'xcode', 'mobile app development', 'app store', 'google play', 'push notifications',
      'deep linking', 'mobile ui', 'mobile ux', 'responsive design', 'progressive web app',
      'offline first', 'mobile testing', 'app performance', 'app accessibility', 'app security',
      'in-app purchase', 'mobile analytics', 'firebase', 'appium', 'test flight', 'mobile ci/cd',
      'arkit', 'arcore', 'widgets', 'mobile gestures', 'location services', 'bluetooth', 'nfc'
    ],
    // Data Science & AI
    dataScience: [
      'machine learning', 'deep learning', 'natural language processing', 'nlp', 'computer vision',
      'data mining', 'data visualization', 'statistical analysis', 'tensorflow', 'pytorch',
      'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv', 'spacy', 'nltk', 'hugging face',
      'transformers', 'bert', 'gpt', 'neural networks', 'reinforcement learning', 'supervised learning',
      'unsupervised learning', 'feature engineering', 'data preprocessing', 'big data', 'hadoop',
      'spark', 'tableau', 'power bi', 'looker', 'data studio', 'jupyter', 'r studio', 'data science',
      'predictive modeling', 'regression', 'classification', 'clustering', 'anomaly detection',
      'time series analysis', 'recommendation systems', 'a/b testing', 'statistics', 'probability',
      'ai ethics', 'responsible ai', 'data ethics', 'chatgpt', 'llm', 'large language models',
      'generative ai', 'artificial intelligence', 'ai', 'ml ops', 'data pipeline', 'etl',
      'model deployment', 'feature store', 'model monitoring', 'experiment tracking', 'mlflow'
    ],
    // Business & Soft Skills
    businessSkills: [
      'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
      'time management', 'managing teams', 'negotiation', 'presentation', 'public speaking', 
      'stakeholder management', 'business development', 'sales', 'marketing', 'finance', 'accounting', 
      'hr', 'human resources', 'strategic planning', 'decision making', 'change management', 
      'conflict resolution', 'emotional intelligence', 'coaching', 'mentoring', 'delegation', 
      'cross-functional collaboration', 'cultural awareness', 'client relations', 'customer service',
      'business analysis', 'process improvement', 'strategic thinking', 'analytical thinking',
      'verbal communication', 'written communication', 'adaptability', 'resilience', 'creativity',
      'innovation', 'persuasion', 'influencing', 'networking', 'relationship building', 
      'cultural intelligence', 'organizational skills', 'self-motivation', 'work ethic', 'integrity',
      'attention to detail', 'active listening', 'empathy', 'flexibility'
    ],
    // Cybersecurity & Information Security
    security: [
      'cybersecurity', 'infosec', 'security', 'penetration testing', 'pen testing', 'ethical hacking',
      'vulnerability assessment', 'siem', 'incident response', 'threat hunting', 'security architecture',
      'web application security', 'network security', 'cloud security', 'devsecops', 'security compliance',
      'gdpr', 'ccpa', 'hipaa', 'pci dss', 'iso 27001', 'soc 2', 'risk assessment', 'security audit',
      'cryptography', 'encryption', 'identity management', 'access control', 'oauth', 'oidc', 'saml',
      'firewall', 'vpn', 'ips', 'ids', 'dlp', 'security awareness', 'security operations', 'soc',
      'blue team', 'red team', 'purple team', 'osint', 'security+', 'cissp', 'ceh', 'oscp', 'zero trust'
    ],
    // Testing & QA
    testing: [
      'quality assurance', 'qa', 'testing', 'test automation', 'manual testing', 'selenium',
      'cypress', 'playwright', 'puppeteer', 'jest', 'mocha', 'jasmine', 'pytest', 'junit',
      'testng', 'test cases', 'test plans', 'test strategy', 'test management', 'bug tracking',
      'regression testing', 'functional testing', 'performance testing', 'load testing', 'stress testing',
      'security testing', 'penetration testing', 'accessibility testing', 'usability testing',
      'test-driven development', 'tdd', 'behavior-driven development', 'bdd', 'cucumber', 'gherkin',
      'end-to-end testing', 'e2e testing', 'unit testing', 'integration testing', 'api testing',
      'postman', 'soapui', 'jmeter', 'gatling', 'locust', 'test automation framework', 'continuous testing',
      'shift left testing', 'quality engineering', 'testcontainers', 'mock testing', 'stub testing'
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
    'familiar with', 'worked with', 'developed with', 'using', 'utilized', 'implemented', 
    'achievements', 'achieved', 'responsible for', 'accountable for', 'managed', 'built', 
    'created', 'designed', 'developed', 'deployed', 'maintained', 'optimized', 'advanced', 
    'expert in', 'certified in', 'trained in', 'competent in', 'comfortable with', 'delivered',
    'led', 'coordinated', 'orchestrated', 'spearheaded', 'drove', 'executed', 'hands-on',
    'technical skills', 'tech stack', 'technology stack'
  ];
  
  contextualIndicators.forEach(indicator => {
    const indicatorPos = textLower.indexOf(indicator);
    if (indicatorPos !== -1) {
      // Look at the text following the indicator
      const followingText = textLower.substring(indicatorPos + indicator.length, indicatorPos + indicator.length + 150);
      allSkills.forEach(skill => {
        if (followingText.includes(skill)) {
          foundSkills.add(skill);
        }
      });
    }
  });

  
  // Add skills from common CV sections
  const skillSectionHeaders = [
    'skills', 'technical skills', 'core competencies', 'competencies', 'expertise',
    'technologies', 'key skills', 'professional skills', 'qualifications',
    'technical expertise', 'proficiencies', 'specialties', 'strengths',
    'capabilities', 'tech stack', 'tools', 'technical tools', 'software'
  ];
  
  for (const header of skillSectionHeaders) {
    const pattern = new RegExp(`${header}[:\\s]*([^]*?)(?:\\n\\n|\\n[A-Z]|$)`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      const skillSection = match[1].toLowerCase();
      allSkills.forEach(skill => {
        if (skillSection.includes(skill)) {
          foundSkills.add(skill);
        }
      });
    }
  }

  // Extract skills from bullet points in job descriptions
  const bulletMatches = text.match(/(?:•|-|\*|\d+\.)\s*([^\n]+)/g);
  if (bulletMatches) {
    bulletMatches.forEach(bullet => {
      const bulletText = bullet.toLowerCase();
      allSkills.forEach(skill => {
        if (bulletText.includes(skill)) {
          foundSkills.add(skill);
        }
      });
    });
  }
  
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
    'javascript': ['react', 'angular', 'vue', 'node.js', 'express', 'next.js', 'typescript'],
    'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
    'java': ['spring', 'hibernate', 'junit', 'maven', 'gradle', 'spring boot', 'microservices'],
    'c#': ['asp.net', '.net core', '.net', 'xamarin', 'unity', 'blazor', 'entity framework'],
    'php': ['laravel', 'symfony', 'wordpress', 'drupal', 'composer', 'magento', 'zend'],
    'ruby': ['rails', 'sinatra', 'rspec', 'capybara', 'rake', 'gems'],
    'go': ['gin', 'echo', 'gorilla', 'gorm', 'cobra', 'buffalo'],
    'rust': ['actix', 'rocket', 'tokio', 'serde', 'wasm'],
    'kotlin': ['spring boot', 'android', 'ktor', 'coroutines', 'retrofit'],
    'swift': ['ios', 'uikit', 'swiftui', 'core data', 'combine', 'cocoapods'],
    'html': ['css', 'javascript', 'responsive design', 'bootstrap', 'tailwind'],
    'css': ['sass', 'less', 'styled-components', 'css modules', 'css-in-js'],
    'aws': ['lambda', 's3', 'ec2', 'dynamodb', 'cloudformation', 'iam', 'cloudfront'],
    'azure': ['azure functions', 'azure devops', 'app service', 'cosmos db', 'azure storage'],
    'gcp': ['cloud functions', 'app engine', 'big query', 'cloud storage', 'gke'],
    'android': ['kotlin', 'java', 'jetpack', 'room', 'compose', 'material design'],
    'ios': ['swift', 'objective-c', 'swiftui', 'uikit', 'core data']
  };
  
  // For each language found, check if frameworks are mentioned in the text or can be inferred
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

  return Array.from(foundSkills);

  // Regex patterns for dates
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*present\b/i,
    /\b\d{4}\s*(-|–|to)\s*\d{4}\b/,
    /\b\d{4}\s*(-|–|to)\s*present\b/i,
      // MM/YYYY - MM/YYYY
    /\b\d{1,2}\/\d{4}\s*(-|–|—|to|through|until)\s*\d{1,2}\/\d{4}\b/i,
    // MM/YYYY - Present
    /\b\d{1,2}\/\d{4}\s*(-|–|—|to|through|until|-)?\s*(present|current|now|ongoing)\b/i,
    // YYYY/MM - YYYY/MM
    /\b\d{4}\/\d{1,2}\s*(-|–|—|to|through|until)\s*\d{4}\/\d{1,2}\b/i,
    // YYYY/MM - Present
    /\b\d{4}\/\d{1,2}\s*(-|–|—|to|through|until|-)?\s*(present|current|now|ongoing)\b/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // If we're collecting job description and hit an empty line, it might be the end of the section
      if (jobDescriptionMode && jobDescriptionBullets.length > 0) {
        jobDescriptionMode = false;
        currentRole.descriptionBullets = [...jobDescriptionBullets];
        jobDescriptionBullets = [];
      }
      continue;
    }
    
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

     // Look for date patterns that often indicate job entries
    const hasDatePattern = datePatterns.some(pattern => pattern.test(line));
    
    // Look for bullet points indicating job responsibilities/achievements
    if (line.match(/^[•\-*]|^\d+\./) && currentRole.title) {
      jobDescriptionBullets.push(line.replace(/^[•\-*]|^\d+\./, '').trim());
      jobDescriptionMode = true;
      continue;
    }
    
    // Look for lines that might contain job titles
    const isJobTitle = jobTitleKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    ) && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*');
    
    if ((isJobTitle || hasDatePattern) && (inJobSection || !currentRole.title)) {
      // If we've collected information about a previous role, save it
      if (currentRole.title && (currentRole.company || currentRole.duration)) {
        // Save any remaining description bullets
        if (jobDescriptionBullets.length > 0) {
          currentRole.descriptionBullets = [...jobDescriptionBullets];
          jobDescriptionBullets = [];
        }
        
        // Try to detect job location if not already found
        if (!currentRole.location) {
          // Look for common location patterns in the description or title
          for (const field of ['title', 'company', 'duration', 'description']) {
            if (currentRole[field]) {
              const locationMatch = currentRole[field].match(/(remote|hybrid|on-site|in-house|work from home|wfh|[\w\s]+,\s*[A-Z]{2}|[\w\s]+,\s*[A-Za-z\s]+)/i);
              if (locationMatch) {
                currentRole.location = locationMatch[0].trim();
                break;
              }
            }
          }
        }
        
        careerHistory.push({...currentRole});
        currentRole = {};
        jobDescriptionMode = false;
      }
      
      // Start a new role
      if (isJobTitle) {
        currentRole.title = line;
        
        // Check if the title line also contains the company
        const titleParts = line.split(/\s*(?:at|@|,|-|with|for)\s+/i);
        if (titleParts.length > 1) {
          currentRole.title = titleParts[0].trim();
          currentRole.company = titleParts[1].trim();
        }
      }
      
      // Look for company name in the surrounding lines
      if (!currentRole.company) {
        for (let j = Math.max(0, i - 1); j <= Math.min(i + 1, lines.length - 1); j++) {
          const nearbyLine = lines[j].trim();
          if (j !== i && nearbyLine && !nearbyLine.match(/^[•\-*]|^\d+\./) && 
              !jobTitleKeywords.some(kw => nearbyLine.toLowerCase().includes(kw)) && 
              !datePatterns.some(p => p.test(nearbyLine))) {
            currentRole.company = nearbyLine;
            break;
          }
        }
      }
      
   
      // Look for dates
      if (hasDatePattern) {
        currentRole.duration = line;
        
        // Try to extract start and end dates as separate fields
        const dateMatch = line.match(/(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december|\d{1,2}\/\d{4}|\d{4})[a-z\s\/]*\d{4}\s*(-|–|—|to|through|until)\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december|\d{1,2}\/\d{4}|\d{4})[a-z\s\/]*\d{4}|present|current|now|ongoing/i);
        
        if (dateMatch) {
          const dateParts = line.split(/(-|–|—|to|through|until)/i);
          if (dateParts.length >= 2) {
            currentRole.startDate = dateParts[0].trim();
            currentRole.endDate = dateParts[dateParts.length - 1].trim();
          }
        }
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
      
      // Look for job location
      const locationPatterns = [
        /\b([A-Za-z\s]+,\s*[A-Z]{2})\b/, // City, State
        /\b([A-Za-z\s]+,\s*[A-Za-z\s]+)\b/, // City, Country
        /\b(Remote|Hybrid|On-site|In-house|Work from home|WFH)\b/i // Work arrangement
      ];
      
      for (let j = Math.max(0, i - 1); j <= Math.min(i + 2, lines.length - 1); j++) {
        const possibleLocationLine = lines[j].trim();
        for (const pattern of locationPatterns) {
          const locationMatch = possibleLocationLine.match(pattern);
          if (locationMatch && !possibleLocationLine.match(/^[•\-*]|^\d+\./)) {
            currentRole.location = locationMatch[0].trim();
            break;
          }
        }
        if (currentRole.location) break;
      }
      
 // Look for job description in the following lines
      let description = '';
      let k = i + 1;
      while (k < lines.length && 
             lines[k].trim() && 
             !lines[k].trim().match(/^[•\-*]|^\d+\./) && 
             !jobTitleKeywords.some(kw => 
                // Make sure we're matching whole words, not parts of words
                new RegExp(`\\b${kw}\\b`, 'i').test(lines[k])
             ) && 
             !datePatterns.some(p => p.test(lines[k]))) {
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
  
  // Education keywords - expanded
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'mba', 'bsc', 'ba', 'ma', 'ms', 'msc',
    'degree', 'diploma', 'certificate', 'certification', 'university', 'college', 'school',
    'institute', 'academy', 'b.a.', 'b.s.', 'b.sc.', 'm.a.', 'm.s.', 'm.sc.', 'ph.d.', 
    'postgraduate', 'undergraduate', 'graduate', 'high school', 'secondary school',
    'technical college', 'vocational training', 'hnd', 'btec', 'associate', 'a.a.',
    'continuing education', 'professional development', 'fellowship', 'scholarship',
    'honors', 'honours', 'cum laude', 'magna cum laude', 'summa cum laude',
    'first class', 'second class', 'upper second', 'lower second', 'third class', 'distinction'
  ];
  
  // Education section headers - expanded
  const educationHeaders = [
    'education', 'academic background', 'qualifications', 'academic qualifications',
    'educational background', 'academic history', 'training', 'formal education',
    'educational qualifications', 'academic training', 'academic credentials',
    'education and training', 'academic achievements', 'certifications',
    'course work', 'coursework', 'degrees', 'academic degrees'
  ];
  
  // Field of study keywords
  const fieldOfStudyKeywords = [
    'computer science', 'engineering', 'business', 'management', 'economics', 'finance',
    'marketing', 'psychology', 'biology', 'chemistry', 'physics', 'mathematics', 'law',
    'medicine', 'nursing', 'pharmacy', 'education', 'arts', 'humanities', 'social sciences',
    'political science', 'international relations', 'communication', 'graphic design',
    'mechanical', 'electrical', 'civil', 'information technology', 'data science',
    'artificial intelligence', 'machine learning', 'cybersecurity', 'networking',
    'systems', 'software engineering', 'web development', 'multimedia', 'architecture'
  ];
  
  // Types of degrees and qualifications
  const degreeTypes = [
    'bachelor of', 'master of', 'doctor of', 'bachelor\'s in', 'master\'s in', 'doctorate in',
    'phd in', 'certificate in', 'diploma in', 'degree in', 'studies in'
  ];
  
  // Expanded date patterns
  const datePatterns = [
    /\b\d{4}\s*(-|–|to)\s*\d{4}\b/,
    /\b\d{4}\s*(-|–|to)\s*present\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\s*(-|–|to)\s*present\b/i,
    /\b\d{1,2}\/\d{4}\s*(-|–|to)\s*\d{1,2}\/\d{4}\b/,
    /\b\d{1,2}\/\d{4}\s*(-|–|to)\s*present\b/i,
    /\b\d{4}\b/ // Single year that might indicate graduation date
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
