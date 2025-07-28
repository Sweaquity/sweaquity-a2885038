# Codebase Analysis Report
Generated on 2025-07-28T11:04:21.304Z

## Summary
- **Total Files**: 311
- **Total Routes**: 17
- **Mapped Routes**: 16
- **Total Issues**: 124

## 🔴 Critical Issues (1)

### fixme_comment
- **File**: src/analyze-codebase.js
- **Severity**: high
- **Message**: FIXME found: comments (known issues)
- **Context**: `// FIXME comments (known issues)`

## 🟡 Dead Ends & Incomplete Work (2)

### missing_page_component
- **Location**: /onboarding
- **Severity**: high
- **Message**: Route "/onboarding" is referenced but no corresponding page component found
- **Occurrences**: 3

### todo_comment
- **Location**: src/analyze-codebase.js
- **Severity**: low
- **Message**: TODO found: comments (potential dead ends or incomplete work)

## 👃 Code Smells (98)

### duplicate_routes
- **File**: undefined
- **Message**: Route "/business/dashboard" is defined/referenced 4 times

### duplicate_routes
- **File**: undefined
- **Message**: Route "/seeker/dashboard" is defined/referenced 4 times

### large_file
- **File**: src/analyze-codebase.js
- **Message**: File is quite large (693 lines) - consider breaking it down
- **Lines**: 693

### excessive_logging
- **File**: src/analyze-codebase.js
- **Message**: 21 console statements found - consider removing debug logs
- **Count**: 21

### large_file
- **File**: src/components/WorkflowManager.tsx
- **Message**: File is quite large (329 lines) - consider breaking it down
- **Lines**: 329

### excessive_logging
- **File**: src/components/auth/LoginForm.tsx
- **Message**: 8 console statements found - consider removing debug logs
- **Count**: 8

### large_file
- **File**: src/components/business/ActiveRolesTable.tsx
- **Message**: File is quite large (345 lines) - consider breaking it down
- **Lines**: 345

### large_file
- **File**: src/components/business/BusinessProfileCompletion.tsx
- **Message**: File is quite large (314 lines) - consider breaking it down
- **Lines**: 314

### excessive_logging
- **File**: src/components/business/BusinessProfileCompletion.tsx
- **Message**: 8 console statements found - consider removing debug logs
- **Count**: 8

### large_file
- **File**: src/components/business/BusinessProfileEditor.tsx
- **Message**: File is quite large (481 lines) - consider breaking it down
- **Lines**: 481

### large_file
- **File**: src/components/business/ProjectApplicationsSection.tsx
- **Message**: File is quite large (607 lines) - consider breaking it down
- **Lines**: 607

### excessive_logging
- **File**: src/components/business/ProjectApplicationsSection.tsx
- **Message**: 15 console statements found - consider removing debug logs
- **Count**: 15

### large_file
- **File**: src/components/business/applications/ApplicationsTable.tsx
- **Message**: File is quite large (410 lines) - consider breaking it down
- **Lines**: 410

### excessive_logging
- **File**: src/components/business/applications/ApplicationsTable.tsx
- **Message**: 18 console statements found - consider removing debug logs
- **Count**: 18

### large_file
- **File**: src/components/business/applications/ContractActionsSection.tsx
- **Message**: File is quite large (379 lines) - consider breaking it down
- **Lines**: 379

### excessive_logging
- **File**: src/components/business/applications/ContractActionsSection.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/components/business/dashboard/tabs/BetaTestingTab.tsx
- **Message**: File is quite large (394 lines) - consider breaking it down
- **Lines**: 394

### excessive_logging
- **File**: src/components/business/dashboard/tabs/BetaTestingTab.tsx
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### large_file
- **File**: src/components/business/profile/BusinessProfileEditor.tsx
- **Message**: File is quite large (481 lines) - consider breaking it down
- **Lines**: 481

### large_file
- **File**: src/components/business/projects/BetaTestingTab.tsx
- **Message**: File is quite large (777 lines) - consider breaking it down
- **Lines**: 777

### excessive_logging
- **File**: src/components/business/projects/BetaTestingTab.tsx
- **Message**: 10 console statements found - consider removing debug logs
- **Count**: 10

### large_file
- **File**: src/components/business/projects/LiveProjectsTab.tsx
- **Message**: File is quite large (343 lines) - consider breaking it down
- **Lines**: 343

### excessive_logging
- **File**: src/components/business/projects/LiveProjectsTab.tsx
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### excessive_logging
- **File**: src/components/business/projects/SubTaskForm.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### excessive_logging
- **File**: src/components/business/projects/TaskCompletionReview.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/components/business/projects/tabs/ProjectTabs.tsx
- **Message**: File is quite large (571 lines) - consider breaking it down
- **Lines**: 571

### large_file
- **File**: src/components/business/roles/ActiveRolesTable.tsx
- **Message**: File is quite large (554 lines) - consider breaking it down
- **Lines**: 554

### excessive_logging
- **File**: src/components/business/roles/ActiveRolesTable.tsx
- **Message**: 9 console statements found - consider removing debug logs
- **Count**: 9

### large_file
- **File**: src/components/business/testing/TestingTab.tsx
- **Message**: File is quite large (417 lines) - consider breaking it down
- **Lines**: 417

### excessive_logging
- **File**: src/components/business/testing/TestingTab.tsx
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### large_file
- **File**: src/components/business/testing/TimeTracker.tsx
- **Message**: File is quite large (539 lines) - consider breaking it down
- **Lines**: 539

### excessive_logging
- **File**: src/components/business/testing/TimeTracker.tsx
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### excessive_logging
- **File**: src/components/business/users/RequestAccessButton.tsx
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/dashboard/TicketAttachmentsList.tsx
- **Message**: File is quite large (403 lines) - consider breaking it down
- **Lines**: 403

### excessive_logging
- **File**: src/components/dashboard/TicketAttachmentsList.tsx
- **Message**: 11 console statements found - consider removing debug logs
- **Count**: 11

### excessive_logging
- **File**: src/components/job-seeker/cv/CVUploadForm.tsx
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/job-seeker/dashboard/EquityTab.tsx
- **Message**: File is quite large (557 lines) - consider breaking it down
- **Lines**: 557

### excessive_logging
- **File**: src/components/job-seeker/dashboard/EquityTab.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/components/job-seeker/dashboard/applications/ApplicationsTabBase.tsx
- **Message**: File is quite large (345 lines) - consider breaking it down
- **Lines**: 345

### large_file
- **File**: src/components/job-seeker/dashboard/applications/EquityProjectItem.tsx
- **Message**: File is quite large (374 lines) - consider breaking it down
- **Lines**: 374

### excessive_logging
- **File**: src/components/job-seeker/dashboard/applications/EquityProjectItem.tsx
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### large_file
- **File**: src/components/job-seeker/dashboard/applications/JobSeekerContractSection.tsx
- **Message**: File is quite large (757 lines) - consider breaking it down
- **Lines**: 757

### excessive_logging
- **File**: src/components/job-seeker/dashboard/applications/JobSeekerContractSection.tsx
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### excessive_logging
- **File**: src/components/job-seeker/dashboard/applications/hooks/useApplicationActions.ts
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### excessive_logging
- **File**: src/components/job-seeker/dashboard/applications/hooks/useMessaging.ts
- **Message**: 8 console statements found - consider removing debug logs
- **Count**: 8

### large_file
- **File**: src/components/job-seeker/dashboard/projects/useProjectsTabs.ts
- **Message**: File is quite large (468 lines) - consider breaking it down
- **Lines**: 468

### excessive_logging
- **File**: src/components/job-seeker/dashboard/projects/useProjectsTabs.ts
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/job-seeker/dashboard/tabs/DashboardTab.tsx
- **Message**: File is quite large (775 lines) - consider breaking it down
- **Lines**: 775

### excessive_logging
- **File**: src/components/job-seeker/dashboard/tabs/DashboardTab.tsx
- **Message**: 12 console statements found - consider removing debug logs
- **Count**: 12

### large_file
- **File**: src/components/job-seeker/profile/ProfileEditor.tsx
- **Message**: File is quite large (332 lines) - consider breaking it down
- **Lines**: 332

### large_file
- **File**: src/components/shared/BetaTestingButton.tsx
- **Message**: File is quite large (820 lines) - consider breaking it down
- **Lines**: 820

### excessive_logging
- **File**: src/components/shared/BetaTestingButton.tsx
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### excessive_logging
- **File**: src/components/shared/DeleteProfileDialog.tsx
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### excessive_logging
- **File**: src/components/shared/LinkedInImportDialog.tsx
- **Message**: 9 console statements found - consider removing debug logs
- **Count**: 9

### large_file
- **File**: src/components/shared/beta-testing/BetaTestingTab.tsx
- **Message**: File is quite large (379 lines) - consider breaking it down
- **Lines**: 379

### excessive_logging
- **File**: src/components/shared/beta-testing/BetaTestingTab.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/components/ticket/TicketCard.tsx
- **Message**: File is quite large (467 lines) - consider breaking it down
- **Lines**: 467

### excessive_logging
- **File**: src/components/ticket/TicketCard.tsx
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/ticket/TicketDashboard.tsx
- **Message**: File is quite large (323 lines) - consider breaking it down
- **Lines**: 323

### excessive_logging
- **File**: src/components/ticket/TicketDashboard.tsx
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/ticket/TicketDetails.tsx
- **Message**: File is quite large (498 lines) - consider breaking it down
- **Lines**: 498

### excessive_logging
- **File**: src/components/ticket/TicketDetails.tsx
- **Message**: 13 console statements found - consider removing debug logs
- **Count**: 13

### hardcoded_url
- **File**: src/components/ticket/TicketForm.tsx
- **Message**: Hardcoded URL found: https://placeholder.com/ticket-attachment-${Date.now()}`);

### large_file
- **File**: src/components/ticket/TicketList.tsx
- **Message**: File is quite large (697 lines) - consider breaking it down
- **Lines**: 697

### excessive_logging
- **File**: src/components/ticket/TicketList.tsx
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### large_file
- **File**: src/components/ticket/TicketManagement.tsx
- **Message**: File is quite large (811 lines) - consider breaking it down
- **Lines**: 811

### excessive_logging
- **File**: src/components/ticket/TicketManagement.tsx
- **Message**: 16 console statements found - consider removing debug logs
- **Count**: 16

### excessive_logging
- **File**: src/components/ticket/TicketService.ts
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### excessive_logging
- **File**: src/components/ticket/details/TicketDetailsTab.tsx
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### large_file
- **File**: src/components/ticket/details/TicketTimeLogTab.tsx
- **Message**: File is quite large (342 lines) - consider breaking it down
- **Lines**: 342

### excessive_logging
- **File**: src/components/ticket/details/TicketTimeLogTab.tsx
- **Message**: 10 console statements found - consider removing debug logs
- **Count**: 10

### large_file
- **File**: src/components/ui/sidebar.tsx
- **Message**: File is quite large (762 lines) - consider breaking it down
- **Lines**: 762

### large_file
- **File**: src/contexts/JobApplicationContext.tsx
- **Message**: File is quite large (311 lines) - consider breaking it down
- **Lines**: 311

### excessive_logging
- **File**: src/contexts/JobApplicationContext.tsx
- **Message**: 9 console statements found - consider removing debug logs
- **Count**: 9

### excessive_logging
- **File**: src/hooks/job-seeker/dashboard/useSessionCheck.ts
- **Message**: 7 console statements found - consider removing debug logs
- **Count**: 7

### excessive_logging
- **File**: src/hooks/job-seeker/dashboard/useTicketsAndMessages.ts
- **Message**: 10 console statements found - consider removing debug logs
- **Count**: 10

### excessive_logging
- **File**: src/hooks/job-seeker/useCVData.ts
- **Message**: 5 console statements found - consider removing debug logs
- **Count**: 5

### excessive_logging
- **File**: src/hooks/jobs/useAcceptedJobsCore.ts
- **Message**: 11 console statements found - consider removing debug logs
- **Count**: 11

### excessive_logging
- **File**: src/hooks/jobs/useJobAcceptance.ts
- **Message**: 6 console statements found - consider removing debug logs
- **Count**: 6

### excessive_logging
- **File**: src/hooks/useNDAIntegration.ts
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### hardcoded_url
- **File**: src/integrations/supabase/client.ts
- **Message**: Hardcoded URL found: https://wjpunccqxowctouvhwis.supabase.co

### excessive_logging
- **File**: src/integrations/supabase/testPolicies.ts
- **Message**: 8 console statements found - consider removing debug logs
- **Count**: 8

### large_file
- **File**: src/integrations/supabase/types.ts
- **Message**: File is quite large (2165 lines) - consider breaking it down
- **Lines**: 2165

### hardcoded_url
- **File**: src/lib/supabase.ts
- **Message**: Hardcoded URL found: https://wjpunccqxowctouvhwis.supabase.co

### excessive_logging
- **File**: src/pages/Auth.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/pages/dashboards/AdminDashboard.tsx
- **Message**: File is quite large (370 lines) - consider breaking it down
- **Lines**: 370

### large_file
- **File**: src/pages/dashboards/BusinessDashboard.tsx
- **Message**: File is quite large (377 lines) - consider breaking it down
- **Lines**: 377

### excessive_logging
- **File**: src/pages/dashboards/BusinessDashboard.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/pages/dashboards/RecruiterDashboard.tsx
- **Message**: File is quite large (411 lines) - consider breaking it down
- **Lines**: 411

### large_file
- **File**: src/pages/dashboards/SweaquityDashboard.tsx
- **Message**: File is quite large (1238 lines) - consider breaking it down
- **Lines**: 1238

### excessive_logging
- **File**: src/pages/dashboards/SweaquityDashboard.tsx
- **Message**: 22 console statements found - consider removing debug logs
- **Count**: 22

### excessive_logging
- **File**: src/pages/projects/ProjectApplicationPage.tsx
- **Message**: 4 console statements found - consider removing debug logs
- **Count**: 4

### large_file
- **File**: src/services/DocumentService.ts
- **Message**: File is quite large (819 lines) - consider breaking it down
- **Lines**: 819

### excessive_logging
- **File**: src/services/DocumentService.ts
- **Message**: 9 console statements found - consider removing debug logs
- **Count**: 9

### large_file
- **File**: src/utils/initializeDocumentTemplates.ts
- **Message**: File is quite large (437 lines) - consider breaking it down
- **Lines**: 437

### excessive_logging
- **File**: src/utils/initializeDocumentTemplates.ts
- **Message**: 35 console statements found - consider removing debug logs
- **Count**: 35

### excessive_logging
- **File**: src/utils/setupStorage.ts
- **Message**: 18 console statements found - consider removing debug logs
- **Count**: 18

### large_file
- **File**: src/utils/skillMatching.ts
- **Message**: File is quite large (333 lines) - consider breaking it down
- **Lines**: 333

## 💀 Unreachable Code (23)

### WorkflowManager
- **File**: src/components/WorkflowManager.tsx
- **Message**: Component "WorkflowManager" appears to be unused
- **Size**: 10707 bytes (329 lines)

### ProjectList
- **File**: src/components/business/projects/ProjectList.tsx
- **Message**: Component "ProjectList" appears to be unused
- **Size**: 2001 bytes (76 lines)

### ApplicationSkills
- **File**: src/components/job-seeker/dashboard/applications/ApplicationSkills.tsx
- **Message**: Component "ApplicationSkills" appears to be unused
- **Size**: 1264 bytes (44 lines)

### PastApplicationItem
- **File**: src/components/job-seeker/dashboard/applications/PastApplicationItem.tsx
- **Message**: Component "PastApplicationItem" appears to be unused
- **Size**: 4151 bytes (122 lines)

### LinkedInImportDialog
- **File**: src/components/shared/LinkedInImportDialog.tsx
- **Message**: Component "LinkedInImportDialog" appears to be unused
- **Size**: 5336 bytes (168 lines)

### ActivityTimeline
- **File**: src/components/ticket/ActivityTimeline.tsx
- **Message**: Component "ActivityTimeline" appears to be unused
- **Size**: 1360 bytes (46 lines)

### FilterBar
- **File**: src/components/ticket/FilterBar.tsx
- **Message**: Component "FilterBar" appears to be unused
- **Size**: 4726 bytes (141 lines)

### TicketActionBar
- **File**: src/components/ticket/TicketActionBar.tsx
- **Message**: Component "TicketActionBar" appears to be unused
- **Size**: 3282 bytes (99 lines)

### TicketForm
- **File**: src/components/ticket/TicketForm.tsx
- **Message**: Component "TicketForm" appears to be unused
- **Size**: 8105 bytes (245 lines)

### TicketList
- **File**: src/components/ticket/TicketList.tsx
- **Message**: Component "TicketList" appears to be unused
- **Size**: 26117 bytes (697 lines)

### aspect-ratio
- **File**: src/components/ui/aspect-ratio.tsx
- **Message**: Component "aspect-ratio" appears to be unused
- **Size**: 141 bytes (7 lines)

### breadcrumb
- **File**: src/components/ui/breadcrumb.tsx
- **Message**: Component "breadcrumb" appears to be unused
- **Size**: 2701 bytes (116 lines)

### carousel
- **File**: src/components/ui/carousel.tsx
- **Message**: Component "carousel" appears to be unused
- **Size**: 6210 bytes (261 lines)

### command
- **File**: src/components/ui/command.tsx
- **Message**: Component "command" appears to be unused
- **Size**: 4879 bytes (154 lines)

### context-menu
- **File**: src/components/ui/context-menu.tsx
- **Message**: Component "context-menu" appears to be unused
- **Size**: 7246 bytes (199 lines)

### drawer
- **File**: src/components/ui/drawer.tsx
- **Message**: Component "drawer" appears to be unused
- **Size**: 3007 bytes (117 lines)

### hover-card
- **File**: src/components/ui/hover-card.tsx
- **Message**: Component "hover-card" appears to be unused
- **Size**: 1184 bytes (28 lines)

### input-otp
- **File**: src/components/ui/input-otp.tsx
- **Message**: Component "input-otp" appears to be unused
- **Size**: 2154 bytes (70 lines)

### menubar
- **File**: src/components/ui/menubar.tsx
- **Message**: Component "menubar" appears to be unused
- **Size**: 7974 bytes (235 lines)

### navigation-menu
- **File**: src/components/ui/navigation-menu.tsx
- **Message**: Component "navigation-menu" appears to be unused
- **Size**: 5046 bytes (129 lines)

### radio-group
- **File**: src/components/ui/radio-group.tsx
- **Message**: Component "radio-group" appears to be unused
- **Size**: 1467 bytes (43 lines)

### sidebar
- **File**: src/components/ui/sidebar.tsx
- **Message**: Component "sidebar" appears to be unused
- **Size**: 23367 bytes (762 lines)

### toggle-group
- **File**: src/components/ui/toggle-group.tsx
- **Message**: Component "toggle-group" appears to be unused
- **Size**: 1739 bytes (60 lines)

