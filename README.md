
# Equity Platform - Project Documentation

## Project Overview

This platform connects three types of users:

1. **Job Seekers** - Professionals looking to earn equity in projects based on their skills
2. **Businesses** - Companies/Startups offering equity for work on their projects
3. **Recruiters** - Professionals connecting talent with businesses

## Core Functionality

### User Types & Workflows

#### Job Seekers
- Create profile with skills (parsed from CV or manually entered)
- View project opportunities that match their skills
- Apply for project tasks/subtasks
- Earn equity based on completed work
- Track equity earned across all projects
- Communicate with businesses through messaging system
- Manage project tasks via ticketing system

#### Businesses
- Create company profile
- Post projects with equity allocation details
- Break down projects into subtasks with specific equity allocations
- Review and accept/reject applications
- Track task completion and allocate equity
- Manage team members and project progress
- Use ticketing system for project management

#### Recruiters
- Access job seeker profiles
- Match talent with business projects
- Earn commission through successful placements

## Process Flows

### User Registration & Profile Creation
1. User registers with email/password
2. User selects account type (Job Seeker, Business, Recruiter)
3. User completes profile:
   - Job Seekers: Personal details, skills, CV upload
   - Businesses: Company details, project information
   - Recruiters: Professional details, focus areas
4. System validates and stores profile information

### Job Application Process
1. Job seeker discovers projects through:
   - Search functionality
   - Skill matching algorithms
   - Direct invitations
2. Job seeker applies to specific task/subtask
3. Business receives notification of application
4. Business reviews application details
5. Business accepts or rejects application
6. If accepted, both parties must confirm acceptance:
   - Business confirms acceptance
   - Job seeker confirms acceptance
7. System creates an accepted job entry with initial equity terms
8. System generates project tickets for tracking work progress

### Contract & Agreement Management
1. Upon mutual acceptance, the system creates an accepted job record
2. **Gap identified**: No formal NDA creation in current implementation
3. Business can upload contract documents to the accepted job
4. Equity terms are formalized and stored in the accepted_jobs table
5. Both parties can review and reference the contract documents
6. System maintains contract version history for compliance

### Work & Equity Tracking
1. Tasks are tracked via a ticket system
2. Job seekers log time against tickets 
3. Job seekers update task progress/completion percentage
4. Businesses review and approve work progress
5. Equity is allocated based on task completion:
   - System calculates earned equity based on completion percentage
   - Allocated equity is tracked in jobs_equity_allocated field
   - **Gap identified**: The jobs_equity_allocated field has no protection against deletion or unauthorized modification
6. Dashboard visualizes equity earned across all projects

### Beta Testing Workflow
1. Users participate in platform beta testing
2. Beta testers report issues through the ticket system
3. Admin dashboard tracks and manages beta testing tickets
4. **Gap identified**: No clear equity allocation for beta testing contributions
5. Beta testers can track their tickets in a dedicated dashboard view

## Data Flow & Key Components

### Authentication & Profiles
- User registration with email verification
- Profile creation with user type selection
- CV parsing for job seeker skill extraction
- Profile data stored in respective tables (profiles, businesses, recruiters)

### Projects & Tasks
- Projects created by businesses with equity allocation
- Projects broken down into subtasks with individual equity allocations
- Application process connects job seekers to specific tasks
- Acceptance creates job relationship and equity agreement

### Equity Management
- Equity allocation defined at project and task level
- Task completion percentage tracked via tickets
- Equity earned calculated based on completion percentage
- **Note**: Equity allocation requires stronger protection mechanisms
- Full equity history viewable in job seeker dashboard

### Task Management
- Ticket system for project tasks
- Time tracking for each ticket
- Status updates and completion tracking
- Integration with equity allocation

## Database Architecture

### Core Tables
- **profiles** - Job seeker profiles with personal details and skills
- **businesses** - Business profiles with company information
- **recruiters** - Recruiter profiles
- **business_projects** - Projects created by businesses
- **project_sub_tasks** - Individual tasks within projects
- **job_applications** - Applications from job seekers to tasks
- **accepted_jobs** - Approved applications with equity agreements
- **tickets** - Task tracking and management
- **time_entries** - Time tracking for tasks

### Key Relationships
- Job seekers apply to tasks (job_applications)
- Accepted applications become jobs (accepted_jobs)
- Tasks generate tickets for tracking (tickets)
- Time logged against tickets (time_entries)
- Equity calculated from task completion

## Identified Gaps & Recommendations

### Security Gaps
1. **Equity Allocation Protection**:
   - The jobs_equity_allocated field in accepted_jobs lacks protection against unauthorized modification
   - Recommendation: Implement audit logging and transaction history for equity allocations
   - Implement row-level security policies to restrict who can modify these values

2. **NDA Implementation**:
   - No formal NDA creation in the job acceptance flow
   - Recommendation: Add a templated NDA generation step when a job is accepted
   - Store signed NDAs in the document management system

3. **Beta Testing Equity**:
   - No clear mechanism for beta testers to earn equity for contributions
   - Recommendation: Create a separate equity pool for beta testing contributions
   - Implement a point system that converts to equity for valuable beta feedback

4. **Data Validation**:
   - Some fields lack proper validation constraints
   - Recommendation: Add stronger validation rules for critical fields
   - Implement transaction integrity checks for equity-related operations

### User Experience Gaps
1. **Onboarding Flow**:
   - Initial user experience could be improved with clearer guidance
   - Recommendation: Add interactive tutorials and tooltips

2. **Notification System**:
   - Current notification logic could be enhanced
   - Recommendation: Expand event-based notifications for critical actions

3. **Mobile Responsiveness**:
   - Ensure all interfaces are fully responsive
   - Test and optimize for mobile devices

## Technical Components

### Frontend
- React with TypeScript
- TailwindCSS for styling
- ShadCN UI component library
- React Router for navigation
- React Query for data fetching

### Backend
- Supabase for database and authentication
- PostgreSQL database with RLS policies
- Storage for documents/CVs

### Key Features
- CV parsing for skill extraction
- Real-time messaging
- Task/ticket management
- Time tracking
- Equity calculation and distribution
- Document management for contracts

## Security & Compliance

### Data Protection
- User data is protected with appropriate access controls
- Sensitive information is stored securely
- Row-level security ensures proper data isolation

### Audit Trails
- Critical actions are logged for accountability
- Equity allocations maintain history for verification
- Document versioning for legal compliance

### Access Controls
- Row-level security policies restrict data access
- Role-based permissions control system functionality
- Authentication guards protect sensitive operations

## Launch Readiness Assessment

The platform is nearly ready for beta testing, with a few recommended enhancements:

1. **Critical Before Launch**:
   - Implement protection mechanisms for equity allocation fields
   - Add formal NDA template creation in job acceptance flow
   - Create audit trails for equity-related transactions

2. **Important for User Experience**:
   - Clarify beta testing equity earning model if applicable
   - Enhance onboarding guidance for new users
   - Improve notification system coverage

3. **Future Enhancements**:
   - Implement equity trading marketplace
   - Add enhanced analytics for businesses
   - Expand recruiter toolset and commission models

By addressing the identified gaps, especially around equity protection, NDA implementation, and beta testing equity, the platform will be well-positioned for a successful beta launch.
# Test change
