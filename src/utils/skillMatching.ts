import { Skill } from '@/types/jobSeeker';

interface SkillRequirement {
  skill: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

// Update the function to handle different skill formats
const extractSkillString = (skill: any): string => {
  if (typeof skill === 'string') return skill.toLowerCase();
  if (skill && typeof skill === 'object') {
    if ('skill' in skill && typeof skill.skill === 'string') return skill.skill.toLowerCase();
    if ('name' in skill && typeof skill.name === 'string') return skill.name.toLowerCase();
  }
  return '';
};

export const calculateSkillMatch = (userSkills: string[], jobSkills: string[]): number => {
  if (!userSkills || !jobSkills) {
    return 0;
  }

  const matchedSkills = userSkills.filter(userSkill =>
    jobSkills.some(jobSkill => userSkill.toLowerCase().includes(jobSkill.toLowerCase()))
  );

  return matchedSkills.length;
};

export const calculateSkillMatchPercentage = (userSkills: string[], jobSkills: string[]): number => {
  if (!userSkills || !jobSkills || jobSkills.length === 0) {
    return 0;
  }

  const matchCount = calculateSkillMatch(userSkills, jobSkills);
  const percentage = (matchCount / jobSkills.length) * 100;

  return parseFloat(percentage.toFixed(2));
};

export const getMissingSkills = (userSkills: string[], jobSkills: string[]): string[] => {
  if (!jobSkills) return [];

  const missingSkills = jobSkills.filter(jobSkill =>
    !userSkills.some(userSkill => userSkill.toLowerCase().includes(jobSkill.toLowerCase()))
  );

  return missingSkills;
};

export const getSkillDifference = (userSkills: string[], jobSkills: string[]): { missing: string[], extra: string[] } => {
  const missing = getMissingSkills(userSkills, jobSkills);

  const extra = userSkills.filter(userSkill =>
    !jobSkills.some(jobSkill => userSkill.toLowerCase().includes(userSkill.toLowerCase()))
  );

  return { missing, extra };
};

export const areSkillsSufficient = (userSkills: string[], jobSkills: string[], threshold: number): boolean => {
  if (!jobSkills || jobSkills.length === 0) {
    return true;
  }

  const matchPercentage = calculateSkillMatchPercentage(userSkills, jobSkills);
  return matchPercentage >= threshold;
};

export const calculateJobSkillMatch = (
  jobSeekerSkills: Skill[] | string[],
  requirements: (string | SkillRequirement)[]
): number => {
  if (!jobSeekerSkills || !requirements || !Array.isArray(jobSeekerSkills) || !Array.isArray(requirements)) {
    return 0;
  }

  if (jobSeekerSkills.length === 0 || requirements.length === 0) {
    return 0;
  }

  // Convert jobSeekerSkills to array of strings
  const jobSeekerSkillStrings = jobSeekerSkills.map(extractSkillString).filter(Boolean);
  
  // Convert requirements to array of strings
  const requirementStrings = requirements.map(extractSkillString).filter(Boolean);

  const matchedSkillsCount = calculateSkillMatch(jobSeekerSkillStrings, requirementStrings);
  return matchedSkillsCount;
};

export const calculateJobSkillMatchPercentage = (
  jobSeekerSkills: Skill[] | string[],
  requirements: (string | SkillRequirement)[]
): number => {
  if (!jobSeekerSkills || !requirements) {
    return 0;
  }

  const requirementsCount = requirements.length;
  if (requirementsCount === 0) {
    return 0;
  }

  const matchedSkillsCount = calculateJobSkillMatch(jobSeekerSkills, requirements);
  const percentage = (matchedSkillsCount / requirementsCount) * 100;
  return parseFloat(percentage.toFixed(2));
};

export const getJobMissingSkills = (
  jobSeekerSkills: Skill[] | string[],
  requirements: (string | SkillRequirement)[]
): string[] => {
  if (!jobSeekerSkills || !requirements) {
    return [];
  }

  // Convert jobSeekerSkills to array of strings
  const jobSeekerSkillStrings = jobSeekerSkills.map(extractSkillString).filter(Boolean);
  
  // Convert requirements to array of strings
  const requirementStrings = requirements.map(extractSkillString).filter(Boolean);

  return getMissingSkills(jobSeekerSkillStrings, requirementStrings);
};

export const getJobSkillDifference = (
  jobSeekerSkills: Skill[] | string[],
  requirements: (string | SkillRequirement)[]
): { missing: string[], extra: string[] } => {
  if (!jobSeekerSkills || !requirements) {
    return { missing: [], extra: [] };
  }

  // Convert jobSeekerSkills to array of strings
  const jobSeekerSkillStrings = jobSeekerSkills.map(extractSkillString).filter(Boolean);
  
  // Convert requirements to array of strings
  const requirementStrings = requirements.map(extractSkillString).filter(Boolean);

  return getSkillDifference(jobSeekerSkillStrings, requirementStrings);
};

export const areJobSkillsSufficient = (
  jobSeekerSkills: Skill[] | string[],
  requirements: (string | SkillRequirement)[] ,
  threshold: number
): boolean => {
  if (!jobSeekerSkills || !requirements) {
    return false;
  }

  const matchPercentage = calculateJobSkillMatchPercentage(jobSeekerSkills, requirements);
  return matchPercentage >= threshold;
};
