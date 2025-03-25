
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

### Data Flow & Key Components

#### Authentication & Profiles
- User registration with email verification
- Profile creation with user type selection
- CV parsing for job seeker skill extraction
- Profile data stored in respective tables (profiles, businesses, recruiters)

#### Projects & Tasks
- Projects created by businesses with equity allocation
- Projects broken down into subtasks with individual equity allocations
- Application process connects job seekers to specific tasks
- Acceptance creates job relationship and equity agreement

#### Equity Management
- Equity allocation defined at project and task level
- Task completion percentage tracked via tickets
- Equity earned calculated based on completion percentage or hours worked
- Full equity history viewable in job seeker dashboard

#### Task Management
- Jira-style ticketing system for project tasks
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
- Equity calculated from task completion or time logged

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
- Edge Functions for specialized processing
- File storage for documents/CVs

### Key Features
- CV parsing for skill extraction
- Real-time messaging
- Task/ticket management
- Time tracking
- Equity calculation and distribution
- Document management for contracts

## Process Flows

### Job Application Process
1. Job seeker views available projects
2. Job seeker applies to specific task
3. Business reviews application
4. Business accepts/rejects application
5. If accepted, job relationship created with equity agreement
6. Task progress tracked through tickets
7. Equity earned based on completion

### Task Completion & Equity Allocation
1. Job seeker updates task progress through tickets
2. Time tracking logs hours worked
3. Business reviews task completion
4. Business approves final equity allocation
5. Equity credited to job seeker's profile
6. Documentation generated for equity agreement

### User Registration
1. User selects account type (Job Seeker, Business, Recruiter)
2. Email verification
3. Profile completion
4. Skills/company information provided
5. Profile becomes visible to relevant users

## System Integrations
- Email notifications
- Document generation
- CV parsing
- Skill matching algorithm
- Time tracking
- Equity calculation

This documentation provides a high-level overview of the platform's architecture, functionality, and workflows. The system is designed to be modular and extensible to accommodate future enhancements.
