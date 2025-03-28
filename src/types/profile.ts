export interface Skill {
  id?: string;
  name: string;
  skill?: string; // For backward compatibility
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Profile {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  bio?: string;
  phone?: string;
  address?: string;
  location?: string;
  availability?: string;
  cv_url?: string;
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  terms_accepted?: boolean;
  is_anonymized?: boolean;
  anonymized_at?: string;
  skills?: Skill[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  created_at?: string;
  updated_at?: string;
}
