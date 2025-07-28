// 📝 TEMPLATE INITIALIZATION FOR YOUR EXISTING DOCUMENT SYSTEM
// Create this file as: src/utils/initializeDocumentTemplates.ts
// Works with your existing DocumentService and template system

import { supabase } from '@/lib/supabase';

// NDA template that matches your DocumentData interface
const NDA_TEMPLATE = `
CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This Confidentiality and Non-Disclosure Agreement ("Agreement") is entered into on {{effectiveDate}} between:

DISCLOSING PARTY:
Company Name: {{businessName}}
Representative: {{businessRepName}}
Title: {{businessRepTitle}}
Email: {{businessEmail}}
Phone: {{businessPhone}}

RECEIVING PARTY:
Name: {{jobseekerName}}
Email: {{jobseekerEmail}}
Phone: {{jobseekerPhone}}

RECITALS

WHEREAS, the Disclosing Party possesses certain confidential and proprietary information related to its business operations, products, services, and strategies;

WHEREAS, the Receiving Party desires to receive and evaluate such confidential information for the purpose of potential business collaboration;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION

For purposes of this Agreement, "Confidential Information" shall include all non-public, proprietary, or confidential information, whether written, oral, electronic, or visual, disclosed by the Disclosing Party to the Receiving Party, including but not limited to:

a) Business plans, strategies, and financial information
b) Technical data, know-how, and trade secrets
c) Customer lists, supplier information, and business relationships
d) Marketing plans, pricing information, and sales data
e) Product development information and specifications
f) Any other information marked as "Confidential" or that should reasonably be considered confidential

2. OBLIGATIONS OF RECEIVING PARTY

The Receiving Party agrees to:

a) Hold and maintain all Confidential Information in strict confidence
b) Not disclose any Confidential Information to any third parties without the prior written consent of the Disclosing Party
c) Use the Confidential Information solely for the purpose of evaluating potential business collaboration
d) Take reasonable precautions to protect the confidentiality of the Confidential Information
e) Return or destroy all Confidential Information upon written request by the Disclosing Party

3. EXCEPTIONS

The obligations of confidentiality shall not apply to information that:

a) Is or becomes publicly available through no breach of this Agreement
b) Was rightfully known to the Receiving Party prior to disclosure
c) Is independently developed by the Receiving Party without use of or reference to Confidential Information
d) Is required to be disclosed by law or court order, provided that the Receiving Party gives prompt notice to the Disclosing Party

4. TERM

This Agreement shall remain in effect for a period of {{confidentialityPeriod}} ({{confidentialityPeriod}}) years from the date of execution, unless terminated earlier by mutual written consent of both parties.

5. REMEDIES

The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages would be inadequate. Therefore, the Disclosing Party shall be entitled to seek injunctive relief and other equitable remedies in addition to any other remedies available at law or in equity.

6. GOVERNING LAW AND DISPUTE RESOLUTION

This Agreement shall be governed by and construed in accordance with applicable law. Any disputes arising out of or relating to this Agreement shall be resolved through binding arbitration administered by {{arbitrationOrg}}.

7. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, or agreements relating to such subject matter.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

DISCLOSING PARTY:                    RECEIVING PARTY:

{{businessName}}                     {{jobseekerName}}

By: ________________________        Signature: ________________________
Name: {{businessRepName}}           Date: {{effectiveDate}}
Title: {{businessRepTitle}}
Date: {{effectiveDate}}
`;

// Work contract template that matches your DocumentData interface
const WORK_CONTRACT_TEMPLATE = `
WORK AGREEMENT AND EQUITY ALLOCATION CONTRACT

This Work Agreement ("Agreement") is entered into on {{effectiveDate}} between:

COMPANY:
{{businessName}}
Representative: {{businessRepName}}
Title: {{businessRepTitle}}
Email: {{businessEmail}}
Phone: {{businessPhone}}

CONTRACTOR:
{{jobseekerName}}
Email: {{jobseekerEmail}}
Phone: {{jobseekerPhone}}

PROJECT DETAILS:
Project Title: {{projectTitle}}
Project Description: {{projectDescription}}

TERMS AND CONDITIONS

1. SCOPE OF WORK

The Contractor agrees to provide services as outlined in the project specifications for "{{projectTitle}}". The specific deliverables, milestones, and timelines will be defined in project documentation and task assignments provided by the Company.

2. EQUITY COMPENSATION

a) Total Equity Allocation: {{equityAmount}}% of {{equityClass}}
b) Equity Type: {{equityClass}} in {{businessName}}
c) Vesting Schedule: Equity shall vest based on project completion milestones and deliverable acceptance
d) Minimum Threshold: No equity shall vest until at least 10% of agreed work is completed
e) Maximum Allocation: Total equity allocation shall not exceed {{equityAmount}}% as specified above

3. WORK ARRANGEMENT

a) Independent Contractor: This Agreement establishes an independent contractor relationship, not employment
b) Remote Work: Work shall be performed remotely unless otherwise specified in project requirements
c) Availability: Contractor commits to reasonable availability during project duration
d) Quality Standards: All deliverables must meet Company's quality standards and specifications

4. INTELLECTUAL PROPERTY

a) Work Product: All work product, inventions, and developments created under this Agreement shall be owned exclusively by the Company
b) Assignment: Contractor hereby assigns all rights, title, and interest in work product to the Company
c) Pre-existing IP: Any pre-existing intellectual property of the Contractor remains the property of the Contractor
d) License: Contractor grants Company a perpetual, royalty-free license to use any pre-existing IP incorporated into the work product

5. CONFIDENTIALITY

This Agreement incorporates by reference the Confidentiality and Non-Disclosure Agreement previously executed between the parties on or about {{effectiveDate}}.

6. PAYMENT AND EQUITY DISTRIBUTION

a) Primary Compensation: Compensation is primarily through equity allocation as specified in Section 2
b) Equity Vesting: Equity will vest upon completion of agreed milestones and acceptance of deliverables
c) No Monetary Guarantee: No monetary payment is guaranteed under this Agreement
d) Expenses: Any project-related expenses must be pre-approved in writing by the Company

7. TERM AND TERMINATION

a) Duration: This Agreement shall remain in effect for {{duration}} weeks or until project completion, whichever occurs first
b) Termination: Either party may terminate this Agreement with two (2) weeks written notice
c) Effect of Termination: Upon termination, Contractor retains any vested equity based on completed and accepted work
d) Survival: Confidentiality and intellectual property obligations survive termination

8. WARRANTIES AND REPRESENTATIONS

a) Authority: Each party represents that it has full authority to enter into this Agreement
b) Originality: Contractor warrants that all work will be original or properly licensed
c) Compliance: Both parties agree to comply with all applicable laws and regulations

9. LIMITATION OF LIABILITY

IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATING TO THIS AGREEMENT.

10. DISPUTE RESOLUTION

Any disputes arising out of or relating to this Agreement shall be resolved through binding arbitration administered by {{arbitrationOrg}} in accordance with its commercial arbitration rules.

11. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with applicable law.

12. ENTIRE AGREEMENT

This Agreement, together with the incorporated NDA, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter hereof.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

COMPANY:                             CONTRACTOR:

{{businessName}}                     {{jobseekerName}}

By: ________________________        Signature: ________________________
Name: {{businessRepName}}           Date: {{effectiveDate}}
Title: {{businessRepTitle}}
Date: {{effectiveDate}}

EQUITY ALLOCATION ACKNOWLEDGMENT:
I acknowledge and agree to receive {{equityAmount}}% of {{equityClass}} in {{businessName}} upon successful completion of work for "{{projectTitle}}".

Contractor Signature: ________________________
Date: {{effectiveDate}}
`;

// Award agreement template
const AWARD_AGREEMENT_TEMPLATE = `
EQUITY AWARD AGREEMENT

This Equity Award Agreement ("Agreement") is entered into on {{effectiveDate}} between:

COMPANY:
{{businessName}}
Representative: {{businessRepName}}
Title: {{businessRepTitle}}
Email: {{businessEmail}}
Phone: {{businessPhone}}

RECIPIENT:
{{jobseekerName}}
Email: {{jobseekerEmail}}
Phone: {{jobseekerPhone}}

RECITALS

WHEREAS, the Recipient has successfully completed the contracted work as specified in the Work Agreement dated {{contractDate}} for the project "{{projectTitle}}";

WHEREAS, the Recipient has {{completedDeliverables}} in accordance with the project specifications and quality standards;

WHEREAS, the Company desires to award equity to the Recipient in recognition of such completed work and contribution to the project;

NOW, THEREFORE, in consideration of the completed work and mutual covenants contained herein, the parties agree as follows:

1. EQUITY AWARD

The Company hereby awards to the Recipient {{equityAmount}}% ({{equityAmount}} percent) of {{equityType}} in {{businessName}}, a {{entityType}}.

2. COMPLETED WORK ACKNOWLEDGMENT

The Company acknowledges that the Recipient has successfully {{completedDeliverables}} and that all work has been completed to the Company's satisfaction in accordance with the agreed specifications.

3. VESTING

The awarded equity shall vest immediately upon execution of this Agreement, representing the Recipient's earned ownership interest in the Company.

4. EQUITY TERMS AND CONDITIONS

a) Equity Type: {{equityType}}
b) Percentage Awarded: {{equityAmount}}%
c) Entity: {{businessName}} ({{entityType}})
d) Voting Rights: As applicable to {{equityType}}
e) Transfer Restrictions: Subject to any applicable transfer restrictions in Company governing documents

5. DOCUMENTATION AND RECORDS

a) Cap Table: This award shall be properly documented in the Company's capitalization table
b) Equity Records: The Company shall maintain accurate records of this equity award
c) Certificate: The Company may issue an equity certificate or other documentation evidencing this award

6. REPRESENTATIONS AND WARRANTIES

a) Company Authority: The Company represents that it has full corporate authority to issue this equity award
b) Valid Issuance: The equity awarded hereunder is validly issued and free from encumbrances
c) Compliance: This award complies with all applicable securities laws and Company governing documents

7. TAX CONSIDERATIONS

The Recipient acknowledges responsibility for any tax consequences arising from this equity award and is advised to consult with tax professionals regarding such matters.

8. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with applicable law.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to the equity award and supersedes all prior negotiations or agreements relating to such subject matter.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

COMPANY:                             RECIPIENT:

{{businessName}}                     {{jobseekerName}}

By: ________________________        Signature: ________________________
Name: {{businessRepName}}           Date: {{effectiveDate}}
Title: {{businessRepTitle}}
Date: {{effectiveDate}}

EQUITY AWARD SUMMARY:
Project: {{projectTitle}}
Work Completed: {{completedDeliverables}}
Equity Awarded: {{equityAmount}}% {{equityType}}
Award Date: {{effectiveDate}}
`;

export const initializeDocumentTemplates = async () => {
  try {
    console.log('🚀 Initializing document templates for your existing DocumentService...');

    // Check if templates already exist
    const { data: existingTemplates, error: checkError } = await supabase
      .from('legal_document_templates')
      .select('template_type')
      .in('template_type', ['nda', 'work_contract', 'award_agreement']);

    if (checkError) {
      console.error('Error checking existing templates:', checkError);
      return false;
    }

    const existingTypes = existingTemplates?.map(t => t.template_type) || [];

    // Create NDA template if it doesn't exist
    if (!existingTypes.includes('nda')) {
      const { error: ndaError } = await supabase
        .from('legal_document_templates')
        .insert({
          template_type: 'nda',
          template_name: 'Standard Non-Disclosure Agreement',
          template_content: NDA_TEMPLATE,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (ndaError) {
        console.error('Error creating NDA template:', ndaError);
      } else {
        console.log('✅ Created NDA template with business/jobseeker placeholders');
      }
    } else {
      console.log('✅ NDA template already exists');
    }

    // Create work contract template if it doesn't exist
    if (!existingTypes.includes('work_contract')) {
      const { error: contractError } = await supabase
        .from('legal_document_templates')
        .insert({
          template_type: 'work_contract',
          template_name: 'Standard Work Agreement and Equity Contract',
          template_content: WORK_CONTRACT_TEMPLATE,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (contractError) {
        console.error('Error creating work contract template:', contractError);
      } else {
        console.log('✅ Created work contract template with equity terms');
      }
    } else {
      console.log('✅ Work contract template already exists');
    }

    // Create award agreement template if it doesn't exist
    if (!existingTypes.includes('award_agreement')) {
      const { error: awardError } = await supabase
        .from('legal_document_templates')
        .insert({
          template_type: 'award_agreement',
          template_name: 'Standard Equity Award Agreement',
          template_content: AWARD_AGREEMENT_TEMPLATE,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (awardError) {
        console.error('Error creating award agreement template:', awardError);
      } else {
        console.log('✅ Created award agreement template');
      }
    } else {
      console.log('✅ Award agreement template already exists');
    }

    console.log('🎉 Document template initialization complete!');
    console.log('Your DocumentService can now generate real legal documents with:');
    console.log('  📋 Business names, contact info, and project details');
    console.log('  👤 Jobseeker names, emails, and contact information');
    console.log('  💼 Project titles, descriptions, and equity percentages');
    console.log('  📅 Current dates and legal terms');
    
    return true;

  } catch (error) {
    console.error('❌ Error initializing document templates:', error);
    return false;
  }
};

// Function to run initialization manually (call this once)
export const runTemplateInitialization = async () => {
  console.log('🎯 Initializing templates for your existing document management system...');
  
  const success = await initializeDocumentTemplates();
  
  if (success) {
    console.log('✅ All document templates are ready!');
    console.log('Your existing hooks can now generate real legal documents:');
    console.log('  🔹 useNDAManagement.generateNDA() → Real NDA with business details');
    console.log('  🔹 useWorkContractManagement.generateWorkContract() → Real contract with equity');
    console.log('  🔹 useAwardAgreementManagement.generateAwardAgreement() → Equity awards');
  } else {
    console.log('❌ Template initialization failed. Check console for errors.');
  }
  
  return success;
};

// Helper function to test template placeholders
export const testTemplatePlaceholders = () => {
  console.log('📋 Available template placeholders for your DocumentData:');
  console.log('Business: {{businessName}}, {{businessRepName}}, {{businessEmail}}, {{businessPhone}}');
  console.log('Jobseeker: {{jobseekerName}}, {{jobseekerEmail}}, {{jobseekerPhone}}');
  console.log('Project: {{projectTitle}}, {{projectDescription}}');
  console.log('Equity: {{equityAmount}}, {{equityClass}}, {{equityType}}');
  console.log('Dates: {{effectiveDate}}, {{contractDate}}');
  console.log('Terms: {{duration}}, {{confidentialityPeriod}}, {{arbitrationOrg}}');
};

// Check if templates exist
export const checkTemplateStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('legal_document_templates')
      .select('template_type, template_name, is_active')
      .eq('is_active', true);

    if (error) throw error;

    console.log('📋 Current active templates:');
    data?.forEach(template => {
      console.log(`  ✅ ${template.template_type}: ${template.template_name}`);
    });

    return data || [];
  } catch (error) {
    console.error('Error checking template status:', error);
    return [];
  }
};