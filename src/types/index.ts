
// Export types from interfaces.ts as the primary type source
export * from './interfaces';

// Export other type modules but avoid name conflicts with interfaces.ts exports
// by not re-exporting conflicting types
import * as JobSeekerTypes from './jobSeeker';
import * as BusinessTypes from './business';
import * as DashboardTypes from './dashboard';

// Export non-conflicting types from these modules
// We'll exclude already exported types like JobApplication, Task, etc.
export {
  // Re-export JobSeeker types that don't conflict
  type JobSeekerProfile,
  type SkillMatch,
  type SkillComparison
} from './jobSeeker';

export {
  // Re-export Business types that don't conflict
  type Business,
  type Project,
  type BusinessMember,
  type ProjectTask 
} from './business';

export {
  // Re-export Dashboard types that don't conflict
  type DashboardTab,
  type TabChangeHandler,
  type TaskType
} from './dashboard';
