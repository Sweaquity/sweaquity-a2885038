
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  id?: string;
  skill: string; // Making this required
  level?: SkillLevel;
  name?: string; // For backward compatibility
}

export interface SkillRequirement {
  skill: string;
  level?: SkillLevel;
  id?: string;
  name?: string; // For backward compatibility
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  email: string;
  location?: string;
  bio?: string;
  phone?: string;
  address?: string;
  availability?: string;
  social_links?: SocialLinks;
  skills: Skill[];
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  terms_accepted?: boolean;
  cv_url?: string;
  account_type?: string;
  created_at?: string;
  updated_at?: string;
}
