
// Due to the file being read-only, we need to modify how data is fetched
// This will require fixing the supabase query in the BusinessDashboard component

const loadApplicationsModified = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        profiles:user_id(first_name, last_name, email, title, location, cv_url, skills, employment_preference),
        project_sub_tasks:task_id(title, description, skill_requirements, equity_allocation, timeframe)
      `)
      .eq('project_id', projectId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error loading applications:", error);
    return [];
  }
};
