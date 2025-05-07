
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DocumentData {
  businessName: string;
  businessRepName: string;
  businessRepTitle: string;
  businessEmail: string;
  businessPhone: string;
  jobseekerName: string;
  jobseekerEmail: string;
  jobseekerPhone: string;
  effectiveDate: string;
  duration: string;
  confidentialityPeriod: string;
  arbitrationOrg: string;
  // Added fields for work contract and award agreement
  projectTitle?: string;
  projectDescription?: string;
  equityAmount?: string;
  equityClass?: string;
  equityType?: string;
  entityType?: string;
  completedDeliverables?: string;
  milestones?: string;
  contractDate?: string; // Date of the original work contract
}

export interface DocumentTemplate {
  id: string;
  template_type: 'nda' | 'work_contract' | 'award_agreement';
  template_version: string;
  template_name: string;
  template_content: string;
}

export interface LegalDocument {
  id: string;
  document_type: 'nda' | 'work_contract' | 'award_agreement';
  business_id: string | null;
  jobseeker_id: string | null;
  project_id: string | null;
  job_application_id: string | null;
  accepted_job_id: string | null;
  status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated';
  version: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
}

export class DocumentService {
  /**
   * Get the latest active template for a document type
   */
  static async getTemplate(documentType: 'nda' | 'work_contract' | 'award_agreement'): Promise<DocumentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', documentType)
        .eq('is_active', true)
        .order('template_version', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to fetch document template');
      return null;
    }
  }
  
  /**
   * Generate document content from template and data
   */
  static generateDocumentContent(template: string, data: DocumentData): string {
    let populatedTemplate = template;
    
    // Replace placeholders with actual data - shared placeholders
    populatedTemplate = populatedTemplate.replace(/\[BUSINESS NAME\/PROJECT NAME\]/g, data.businessName);
    populatedTemplate = populatedTemplate.replace(/\[Representative Name\]/g, data.businessRepName);
    populatedTemplate = populatedTemplate.replace(/\[Title\/Role\]/g, data.businessRepTitle);
    populatedTemplate = populatedTemplate.replace(/\[Email\]/g, data.businessEmail);
    populatedTemplate = populatedTemplate.replace(/\[Phone\]/g, data.businessPhone);
    populatedTemplate = populatedTemplate.replace(/\[JOBSEEKER NAME\]/g, data.jobseekerName);
    populatedTemplate = populatedTemplate.replace(/\[Date\]/g, data.effectiveDate);
    populatedTemplate = populatedTemplate.replace(/\[Duration\]/g, data.duration);
    populatedTemplate = populatedTemplate.replace(/\[Confidentiality Period\]/g, data.confidentialityPeriod);
    populatedTemplate = populatedTemplate.replace(/\[major international arbitration organization\]/g, data.arbitrationOrg);
    
    // Additional fields for work contract and award agreement
    if (data.projectTitle) {
      populatedTemplate = populatedTemplate.replace(/\[Project Title\]/g, data.projectTitle);
    }
    if (data.projectDescription) {
      populatedTemplate = populatedTemplate.replace(/\[Detailed description of the project and services to be performed\]/g, data.projectDescription);
    }
    if (data.equityAmount) {
      populatedTemplate = populatedTemplate.replace(/\[Percentage\]%/g, data.equityAmount);
      populatedTemplate = populatedTemplate.replace(/\[percentage\]%/g, data.equityAmount);
      populatedTemplate = populatedTemplate.replace(/\[number\]/g, data.equityAmount);
    }
    if (data.equityClass) {
      populatedTemplate = populatedTemplate.replace(/\[specify equity class, e.g., "common stock"\]/g, data.equityClass);
      populatedTemplate = populatedTemplate.replace(/\[type of equity, e.g., "Common Stock," "LLC Membership Units," etc.\]/g, data.equityClass);
      populatedTemplate = populatedTemplate.replace(/\[equity class\]/g, data.equityClass);
    }
    if (data.entityType) {
      populatedTemplate = populatedTemplate.replace(/\[Corporation\/LLC\/Partnership\/Other\/Not Yet Formed\]/g, data.entityType);
    }
    if (data.equityType) {
      populatedTemplate = populatedTemplate.replace(/\[Common Stock\/Preferred Stock\/Membership Units\/Future Equity Rights\/Other\]/g, data.equityType);
    }
    if (data.contractDate) {
      populatedTemplate = populatedTemplate.replace(/\[date of Equity Work Contract\]/g, data.contractDate);
    }
    if (data.completedDeliverables) {
      populatedTemplate = populatedTemplate.replace(/\[completed the services\/completed certain milestones\/provided services for the specified time period\]/g, data.completedDeliverables);
      populatedTemplate = populatedTemplate.replace(/\[description of completed work that forms the basis for this equity award\]/g, data.completedDeliverables);
    }
    if (data.milestones) {
      // For any milestone placeholders in the template
      populatedTemplate = populatedTemplate.replace(/\[Milestone 1\] - \[Due Date\]/g, data.milestones);
    }
    
    return populatedTemplate;
  }
  
  /**
   * Create HTML version of the document for preview
   */
  static createHtmlPreview(content: string): string {
    // Replace line breaks with HTML breaks
    let html = content.replace(/\n/g, '<br>');
    
    // Add basic styling
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.5;">
        ${html}
      </div>
    `;
    
    return html;
  }
  
  /**
   * Create a new legal document in the database
   */
  static async createDocument(
    documentType: 'nda' | 'work_contract' | 'award_agreement',
    businessId: string | null,
    jobseekerId: string | null,
    projectId: string | null,
    jobApplicationId: string | null = null,
    acceptedJobId: string | null = null
  ): Promise<LegalDocument | null> {
    try {
      // Create initial storage path
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const documentId = crypto.randomUUID();
      const storagePath = `${documentType}/${documentId}/${timestamp}-draft.txt`;
      
      // Insert document record
      const { data, error } = await supabase
        .from('legal_documents')
        .insert({
          document_type: documentType,
          business_id: businessId,
          jobseeker_id: jobseekerId,
          project_id: projectId,
          job_application_id: jobApplicationId,
          accepted_job_id: acceptedJobId,
          status: 'draft',
          version: '0.1',
          storage_path: storagePath
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating legal document:', error);
      toast.error('Failed to create legal document');
      return null;
    }
  }
  
  /**
   * Save document content to storage
   */
  static async saveDocumentContent(documentPath: string, content: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .storage
        .from('legal_documents')
        .upload(documentPath, content, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (error) throw error;
      
      return data.path;
    } catch (error) {
      console.error('Error saving document content:', error);
      toast.error('Failed to save document content');
      return null;
    }
  }
  
  /**
   * Get document content from storage
   */
  static async getDocumentContent(documentPath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .storage
        .from('legal_documents')
        .download(documentPath);
      
      if (error) throw error;
      
      return await data.text();
    } catch (error) {
      console.error('Error fetching document content:', error);
      toast.error('Failed to fetch document content');
      return null;
    }
  }
  
  /**
   * Update document status
   */
  static async updateDocumentStatus(
    documentId: string, 
    status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({ status })
        .eq('id', documentId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    }
  }
  
  /**
   * Get all documents for a job application
   */
  static async getDocumentsForJobApplication(jobApplicationId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('job_application_id', jobApplicationId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching job application documents:', error);
      toast.error('Failed to fetch documents');
      return [];
    }
  }

  /**
   * Get all documents for an accepted job
   */
  static async getDocumentsForAcceptedJob(acceptedJobId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('accepted_job_id', acceptedJobId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching accepted job documents:', error);
      toast.error('Failed to fetch documents');
      return [];
    }
  }
  
  /**
   * Insert default templates into the database if they don't exist
   */
  static async ensureDefaultTemplatesExist(): Promise<void> {
    try {
      // Check if we already have templates
      const { data: existingTemplates, error: checkError } = await supabase
        .from('document_templates')
        .select('template_type')
        .in('template_type', ['nda', 'work_contract', 'award_agreement']);
      
      if (checkError) {
        console.error('Error checking existing templates:', checkError);
        return;
      }
      
      const existingTypes = new Set(existingTemplates?.map(t => t.template_type));
      
      // Add NDA template if needed
      if (!existingTypes.has('nda')) {
        await supabase.from('document_templates').insert({
          template_type: 'nda',
          template_name: 'Standard NDA Template',
          template_content: this.getNdaTemplate()
        });
      }
      
      // Add Work Contract template if needed
      if (!existingTypes.has('work_contract')) {
        await supabase.from('document_templates').insert({
          template_type: 'work_contract',
          template_name: 'Equity Work Contract',
          template_content: this.getWorkContractTemplate()
        });
      }
      
      // Add Award Agreement template if needed
      if (!existingTypes.has('award_agreement')) {
        await supabase.from('document_templates').insert({
          template_type: 'award_agreement',
          template_name: 'Equity Award Agreement',
          template_content: this.getAwardAgreementTemplate()
        });
      }
      
    } catch (error) {
      console.error('Error ensuring default templates exist:', error);
    }
  }
  
  /**
   * Get the NDA template text
   */
  private static getNdaTemplate(): string {
    return `MUTUAL NON-DISCLOSURE AGREEMENT
BETWEEN:
[BUSINESS NAME/PROJECT NAME] represented by [Representative Name], [Title/Role], with contact details: [Email], [Phone] ("Business Party")

AND:
[JOBSEEKER NAME] with contact details: [Email], [Phone] ("Jobseeker Party")

EFFECTIVE DATE: [Date]

1. PURPOSE
1.1 The parties wish to explore a potential business relationship wherein the Jobseeker Party may provide services to the Business Party in exchange for equity compensation ("Proposed Relationship"). During discussions regarding the Proposed Relationship, each party may disclose to the other certain confidential and proprietary information.
1.2 This Agreement is intended to prevent the unauthorized disclosure and use of Confidential Information (as defined below) shared between the parties.
1.3 The Business Party may be an established business entity, a business in formation, or an individual or group pursuing a business venture. This Agreement applies regardless of the Business Party's formal registration status.

2. DEFINITION OF CONFIDENTIAL INFORMATION
2.1 "Confidential Information" means any information disclosed by one party (the "Disclosing Party") to the other party (the "Receiving Party"), either directly or indirectly, in writing, orally, or by inspection of tangible items, which is designated as "Confidential," "Proprietary," or some similar designation, or that should reasonably be understood to be confidential given the nature of the information and the circumstances of disclosure.
2.2 Confidential Information may include, but is not limited to:
a) Business plans, marketing strategies, financial data, and projections;
b) Technical information, know-how, trade secrets, software, algorithms, and inventions;
c) Product designs, specifications, and development plans;
d) Customer and supplier information;
e) The terms of the Proposed Relationship; and
f) Any other non-public information relating to the business or technology of either party.
2.3 Confidential Information shall not include information that:
a) Was in the Receiving Party's possession prior to disclosure by the Disclosing Party;
b) Is or becomes publicly available through no fault of the Receiving Party;
c) Is rightfully received by the Receiving Party from a third party without a duty of confidentiality;
d) Is independently developed by the Receiving Party without use of the Disclosing Party's Confidential Information; or
e) Is disclosed by the Receiving Party with the Disclosing Party's prior written approval.

3. OBLIGATIONS OF RECEIVING PARTY
3.1 The Receiving Party shall:
a) Use the Confidential Information solely for the purpose of evaluating the Proposed Relationship;
b) Protect the Confidential Information with at least the same degree of care as it protects its own confidential information, but in no case less than reasonable care;
c) Not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party;
d) Limit access to the Confidential Information to its employees, agents, representatives, and advisors who have a need to know such information for the purpose of evaluating the Proposed Relationship and who are bound by confidentiality obligations no less restrictive than those contained herein; and
e) Return or destroy all Confidential Information upon the Disclosing Party's request or upon termination of discussions regarding the Proposed Relationship.

4. TERM AND TERMINATION
4.1 This Agreement shall remain in effect for a period of [Duration] years from the Effective Date, unless terminated earlier by mutual written agreement of the parties.
4.2 The obligations of confidentiality and non-use contained herein shall survive the termination of this Agreement for a period of [Confidentiality Period] years thereafter.

5. NO OBLIGATION
5.1 Nothing in this Agreement shall obligate either party to proceed with the Proposed Relationship or any other transaction between them.
5.2 Neither party shall be entitled to any compensation from the other for any services, expenses, or costs incurred in connection with discussions regarding the Proposed Relationship, unless otherwise agreed to in writing.

6. NO LICENSE OR WARRANTY
6.1 No license to any patent, trademark, copyright, trade secret, or other intellectual property right is granted or implied by this Agreement or by the disclosure of Confidential Information hereunder.
6.2 ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS" WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, REGARDING ITS ACCURACY OR COMPLETENESS.

7. REMEDIES
7.1 The parties acknowledge that money damages may not be a sufficient remedy for any breach of this Agreement and that the Disclosing Party shall be entitled to seek injunctive or other equitable relief to prevent or remedy any breach or threatened breach of this Agreement, in addition to all other remedies available at law or in equity.

8. DISPUTE RESOLUTION
8.1 Good Faith Negotiation. The parties agree to attempt in good faith to resolve any dispute arising out of or relating to this Agreement promptly by negotiation between representatives who have authority to settle the controversy.
8.2 Mediation. If the dispute cannot be settled through direct negotiations, the parties agree to try in good faith to settle the dispute by mediation administered by a mutually agreed upon neutral third party before resorting to arbitration, litigation, or some other dispute resolution procedure.
8.3 Arbitration or Court Proceedings. If the parties cannot resolve the dispute through negotiation or mediation, either party may initiate arbitration or court proceedings. The parties may agree on the selection of a mutually acceptable arbitrator and arbitration rules. If the parties do not reach such agreement within 30 days of the initiation of the dispute resolution process, either party may commence proceedings in a court of competent jurisdiction.

9. GENERAL PROVISIONS
9.1 Choice of Forum. Any dispute arising out of or relating to this Agreement shall be resolved in a forum of the Disclosing Party's choosing, selected from the following options: (a) the courts of the jurisdiction where the Disclosing Party has its principal place of business, (b) arbitration in a location chosen by the Disclosing Party according to the rules of [major international arbitration organization], or (c) such other forum as the parties may agree upon in writing.
9.2 Assignment. This Agreement may not be assigned by either party without the prior written consent of the other party.
9.3 Entire Agreement. This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements, oral or written, made with respect thereto.
9.4 Amendment. This Agreement may only be amended by a written instrument executed by both parties.
9.5 Severability. If any provision of this Agreement is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this Agreement shall otherwise remain in full force and effect.
9.6 No Waiver. No failure or delay by either party in exercising any right under this Agreement shall operate as a waiver of such right or any other right.
9.7 Counterparts and Electronic Signatures. This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed to be original signatures for all purposes.
9.8 Notice. All notices under this Agreement shall be in writing and shall be delivered by email with confirmation of receipt, by registered mail, or by courier to the addresses provided above.
9.9 Independent Legal Advice. Each party acknowledges that it has had the opportunity to seek independent legal advice prior to executing this Agreement.
9.10 Sweaquity Platform Role. The parties acknowledge that this Agreement is facilitated through the Sweaquity platform but represents a direct legal relationship between the parties. Sweaquity is not a party to this Agreement.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

BUSINESS PARTY:
[BUSINESS NAME/PROJECT NAME]

Signature: ________________________
Name: ___________________________
Title/Role: _______________________
Date: ____________________________

JOBSEEKER PARTY:
[JOBSEEKER NAME]

Signature: ________________________
Date: ____________________________`;
  }
  
  /**
   * Get the Work Contract template text
   */
  private static getWorkContractTemplate(): string {
    return `EQUITY WORK CONTRACT
BETWEEN:
[BUSINESS NAME/PROJECT NAME] represented by [Representative Name], [Title/Role], with contact details: [Email], [Phone] ("Business Party")

AND:
[JOBSEEKER NAME] with contact details: [Email], [Phone] ("Jobseeker Party")

EFFECTIVE DATE: [Date]

1. PURPOSE AND SCOPE
1.1 This Equity Work Contract ("Contract") establishes the terms under which the Jobseeker Party will perform certain services for the Business Party in exchange for equity compensation.

1.2 The Business Party desires to engage the Jobseeker Party to provide the services described in Exhibit A (the "Services"), and the Jobseeker Party desires to provide such Services to the Business Party.

1.3 This Contract is facilitated through the Sweaquity platform but represents a direct agreement between the Business Party and the Jobseeker Party.

1.4 The Business Party may be an established business entity, a business in formation, or an individual or group pursuing a business venture. This Contract applies regardless of the Business Party's formal registration status, with the understanding that equity to be transferred will be in the current or future business entity that owns the project described in Exhibit A.

2. SERVICES AND DELIVERABLES
2.1 Scope of Services. The Jobseeker Party shall perform the Services as described in Exhibit A attached hereto and incorporated herein by reference.

2.2 Timeline and Milestones. The Jobseeker Party shall perform the Services according to the timeline and milestones set forth in Exhibit A.

2.3 Reporting and Communication. The Jobseeker Party shall provide regular updates on the progress of the Services as specified in Exhibit A.

2.4 Acceptance Criteria. The acceptance criteria for the Services and any deliverables shall be as specified in Exhibit A.

3. EQUITY COMPENSATION
3.1 Equity Award. In consideration for the satisfactory performance of the Services, the Business Party agrees to award the Jobseeker Party equity in the Business as detailed in Exhibit B ("Equity Compensation").

3.2 Vesting Schedule. The Equity Compensation shall vest according to one of the following methods, as specified in Exhibit B:
a) Percentage Completion Method: Equity vests proportionally as specific milestones or deliverables are completed and accepted by the Business Party; or
b) Time and Materials Method: Equity vests proportionally based on documented hours worked on the Services.

3.3 Documentation and Tracking. Both parties shall use the Sweaquity platform to track and document progress towards completion of Services and the corresponding vesting of Equity Compensation.

3.4 Final Equity Award. Upon completion of the Services or at intervals specified in Exhibit B, the Business Party shall execute an Equity Award Agreement to formally grant the vested equity to the Jobseeker Party.

3.5 Future Entity Formation. If the Business Party is not yet a formally registered business entity at the time of this Contract, the Business Party commits to:
a) Formalize the business structure at an appropriate future time;
b) Properly document and recognize the Jobseeker Party's equity interests upon formation;
c) Include provisions in the formation documents that protect the Jobseeker Party's equity interests as described in this Contract; and
d) Provide the Jobseeker Party with all necessary documentation of their equity ownership once the entity is formed.

4. INTELLECTUAL PROPERTY RIGHTS
4.1 Assignment of Work Product. Subject to payment of the Equity Compensation, the Jobseeker Party hereby irrevocably assigns, transfers, and conveys to the Business Party all right, title, and interest throughout the world in and to all work product, including deliverables, inventions, works of authorship, designs, know-how, and other intellectual property created, conceived, or developed by the Jobseeker Party in connection with the Services (collectively, the "Work Product").

4.2 Project Restriction. The Business Party shall only use the Work Product for the specific project described in Exhibit A ("Project") and shall not use, repurpose, or incorporate the Work Product into any other project, product, or service not directly related to the Project without the Jobseeker Party's prior written consent and appropriate additional compensation. This restriction remains in effect regardless of whether the Contract is completed or terminated early.

4.3 Pre-existing IP. If the Jobseeker Party incorporates into any Work Product any intellectual property owned by the Jobseeker Party or a third party prior to the commencement of the Services ("Pre-existing IP"), the Jobseeker Party hereby grants to the Business Party a non-exclusive, royalty-free, perpetual, irrevocable, worldwide license to use, reproduce, distribute, modify, and prepare derivative works of such Pre-existing IP as incorporated into the Work Product, solely for purposes of the Project.

4.4 Business IP License. The Business Party grants to the Jobseeker Party a limited, non-exclusive, non-transferable license to use intellectual property owned by the Business Party ("Business IP") solely for the purpose of performing the Services during the term of this Contract.

4.5 Mutual Non-circumvention. Neither party shall use the other party's intellectual property, business concepts, or ideas disclosed during the course of this Contract for any purpose other than the performance of the Services and Project implementation, without the prior written consent of the disclosing party.

4.6 Portfolio Rights. Notwithstanding the assignment of Work Product, the Jobseeker Party retains the right to display and describe their work on the Project in their professional portfolio, provided that no confidential information of the Business Party is disclosed.

5. CONFIDENTIALITY
5.1 Both parties agree to maintain the confidentiality of any proprietary or confidential information disclosed by the other party in connection with this Contract, as set forth in any separate Non-Disclosure Agreement executed by the parties.

6. REPRESENTATIONS AND WARRANTIES
6.1 Mutual Representations. Each party represents and warrants that:
a) It has the full right, power, and authority to enter into and perform this Contract;
b) Its performance under this Contract will not conflict with any other agreement or obligation; and
c) It will comply with all applicable laws, rules, and regulations in performing its obligations under this Contract.

6.2 Jobseeker Party Representations. The Jobseeker Party represents and warrants that:
a) The Jobseeker Party has the requisite skills, experience, and qualifications to perform the Services;
b) The Services will be performed in a professional and workmanlike manner in accordance with generally accepted industry standards;
c) The Work Product will not knowingly infringe upon or violate any intellectual property rights of any third party; and
d) The Jobseeker Party will not use any unauthorized third-party intellectual property in performing the Services.

6.3 Business Party Representations. The Business Party represents and warrants that:
a) It has the right or will have the right to issue the Equity Compensation as contemplated by this Contract;
b) It will provide the Jobseeker Party with reasonable access to information, materials, and assistance necessary for the Jobseeker Party to perform the Services; and
c) It will review and provide feedback on deliverables in a timely manner.

7. TERM AND TERMINATION
7.1 Term. This Contract shall commence on the Effective Date and shall continue until the completion of the Services, unless earlier terminated as provided herein.

7.2 Termination for Convenience. Either party may terminate this Contract for convenience upon [number] days' written notice to the other party. In the event of such termination, the Jobseeker Party shall be entitled to receive Equity Compensation proportionate to the Services completed as of the termination date.

7.3 Termination for Cause. Either party may terminate this Contract for cause upon written notice if the other party materially breaches this Contract and fails to cure such breach within [number] days after receiving written notice thereof.

7.4 Effect of Termination. Upon termination of this Contract:
a) The Jobseeker Party shall deliver to the Business Party all Work Product, whether complete or in progress;
b) The Business Party shall award the Jobseeker Party the Equity Compensation vested as of the termination date; and
c) The parties shall cooperate to ensure an orderly wind-down of the Services.

7.5 Survival. Sections 4 (Intellectual Property Rights), 5 (Confidentiality), 8 (Limitation of Liability), 9 (Indemnification), and 11 (General Provisions) shall survive the termination or expiration of this Contract.

8. LIMITATION OF LIABILITY
8.1 EXCLUSION OF DAMAGES. IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR LOSS OF BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO THIS CONTRACT, REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

8.2 CAP ON LIABILITY. EACH PARTY'S TOTAL CUMULATIVE LIABILITY UNDER THIS CONTRACT SHALL NOT EXCEED THE TOTAL VALUE OF THE EQUITY COMPENSATION TO BE AWARDED TO THE JOBSEEKER PARTY UNDER THIS CONTRACT.

9. INDEMNIFICATION
9.1 Jobseeker Party Indemnification. The Jobseeker Party shall indemnify, defend, and hold harmless the Business Party from and against any and all claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) the Jobseeker Party's breach of any representation, warranty, or obligation under this Contract; or (b) any allegation that the Work Product infringes or misappropriates any third party's intellectual property rights.

9.2 Business Party Indemnification. The Business Party shall indemnify, defend, and hold harmless the Jobseeker Party from and against any and all claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) the Business Party's breach of any representation, warranty, or obligation under this Contract; or (b) the Jobseeker Party's use of Business IP in accordance with this Contract.

10. SWEAQUITY DISCLAIMER
10.1 Platform Role. The parties acknowledge that Sweaquity is merely facilitating the connection between the Business Party and the Jobseeker Party and the tracking of Services and Equity Compensation. Sweaquity is not a party to this Contract.

10.2 No Liability. SWEAQUITY SHALL NOT BE LIABLE FOR ANY ISSUES, DISPUTES, OR CLAIMS ARISING BETWEEN THE PARTIES RELATED TO THIS CONTRACT, INCLUDING BUT NOT LIMITED TO DISPUTES REGARDING THE QUALITY OF SERVICES, VESTING OF EQUITY, TAX CONSEQUENCES, OR COMPLIANCE WITH APPLICABLE LAWS.

10.3 No Tax or Legal Advice. The parties acknowledge that Sweaquity does not provide tax, legal, or professional advice of any kind. Each party is solely responsible for ensuring its own compliance with applicable laws, regulations, and tax obligations related to this Contract.

10.4 Permanent Record. The parties acknowledge and agree that projects with time-based or percentage completion tracking cannot be deleted from the Sweaquity platform once established, to maintain transparency and accountability for both parties.

11. DISPUTE RESOLUTION
11.1 Good Faith Negotiation. The parties agree to attempt in good faith to resolve any dispute arising out of or relating to this Contract promptly by negotiation between representatives who have authority to settle the controversy.

11.2 Mediation. If the dispute cannot be settled through direct negotiations, the parties agree to try in good faith to settle the dispute by mediation administered by a mutually agreed upon neutral third party before resorting to arbitration, litigation, or some other dispute resolution procedure.

11.3 Arbitration or Court Proceedings. If the parties cannot resolve the dispute through negotiation or mediation, either party may initiate arbitration or court proceedings. The parties may agree on the selection of a mutually acceptable arbitrator and arbitration rules. If the parties do not reach such agreement within 30 days of the initiation of the dispute resolution process, either party may commence proceedings in a court of competent jurisdiction.

12. GENERAL PROVISIONS
12.1 Independent Contractor Relationship. The Jobseeker Party is an independent contractor and not an employee, agent, partner, or joint venturer of the Business Party. The Jobseeker Party shall be solely responsible for all taxes, withholdings, and other statutory or contractual obligations related to the Jobseeker Party's compensation, including but not limited to income tax, self-employment tax, and social security payments, as applicable in the Jobseeker Party's jurisdiction.

12.2 Choice of Forum. Any dispute arising out of or relating to this Contract shall be resolved in a forum of the Business Party's choosing, selected from the following options: (a) the courts of the jurisdiction where the Business Party has its principal place of business, (b) arbitration in a location chosen by the Business Party according to the rules of [major international arbitration organization], or (c) such other forum as the parties may agree upon in writing.

12.3 Assignment. Neither party may assign this Contract or any rights or obligations hereunder without the prior written consent of the other party, except that the Business Party may assign this Contract to a successor in interest in connection with a merger, acquisition, or sale of all or substantially all of its assets.

12.4 Entire Agreement. This Contract, together with all exhibits and any separate Non-Disclosure Agreement between the parties, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, proposals, or representations, written or oral, concerning its subject matter.

12.5 Amendment. This Contract may only be amended by a written instrument executed by both parties.

12.6 Severability. If any provision of this Contract is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this Contract shall otherwise remain in full force and effect.

12.7 No Waiver. No failure or delay by either party in exercising any right under this Contract shall operate as a waiver of such right or any other right.

12.8 Notices. All notices required or permitted under this Contract shall be in writing and shall be deemed effective upon personal delivery, upon confirmation of receipt if transmitted by email, or three (3) days after delivery by internationally recognized courier service to the addresses set forth above or to such other address as either party may specify in writing.

12.9 Counterparts and Electronic Signatures. This Contract may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed to be original signatures for all purposes.

12.10 Independent Legal Advice. Each party acknowledges that it has had the opportunity to seek independent legal advice prior to executing this Contract.

IN WITNESS WHEREOF, the parties have executed this Contract as of the Effective Date.

BUSINESS PARTY:
[BUSINESS NAME/PROJECT NAME]

Signature: ________________________
Name: ___________________________
Title/Role: _______________________
Date: ____________________________

JOBSEEKER PARTY:
[JOBSEEKER NAME]

Signature: ________________________
Date: ____________________________

EXHIBIT A: DESCRIPTION OF SERVICES
Project Title: [Project Title]

Project Description: [Detailed description of the project and services to be performed]

Deliverables:
[Deliverable 1]
[Deliverable 2]
[Deliverable 3] [Add more as needed]

Timeline and Milestones:
[Milestone 1] - [Due Date]
[Milestone 2] - [Due Date]
[Milestone 3] - [Due Date] [Add more as needed]

Reporting Requirements:
[Specify frequency and format of progress reports]

Acceptance Criteria:
[Specify how deliverables will be evaluated and approved]

EXHIBIT B: EQUITY COMPENSATION
Total Equity Amount: [Percentage]% of [specify equity class, e.g., "common stock"] in [BUSINESS NAME/PROJECT NAME]

Vesting Method (select one):
□ Percentage Completion Method
□ Time and Materials Method

Vesting Schedule (for Percentage Completion Method):
[Milestone 1] - [Percentage]% of Total Equity
[Milestone 2] - [Percentage]% of Total Equity
[Milestone 3] - [Percentage]% of Total Equity [Add more as needed]

Hourly Rate (for Time and Materials Method):
[Percentage]% equity per [number] hours worked, up to a maximum of [Percentage]% total equity

Documentation Requirements:
[Specify requirements for documenting work completion or hours worked]

Equity Award Schedule:
[Specify when formal equity awards will be issued, e.g., upon completion of each milestone or at project completion]

Future Entity Provisions (if Business Party is not yet formally registered):
[Specify commitments regarding future entity formation, including timeline, equity structure, and documentation process]`;
  }
  
  /**
   * Get the Award Agreement template text
   */
  private static getAwardAgreementTemplate(): string {
    return `EQUITY AWARD AGREEMENT
BETWEEN:
[BUSINESS NAME/PROJECT NAME] represented by [Representative Name], [Title/Role], with contact details: [Email], [Phone] ("Business Party")

AND:
[JOBSEEKER NAME] with contact details: [Email], [Phone] ("Recipient Party")

EFFECTIVE DATE: [Date]

WHEREAS, the Business Party and the Recipient Party entered into an Equity Work Contract dated [date of Equity Work Contract] (the "Contract") pursuant to which the Recipient Party agreed to perform certain services for the Business Party in exchange for equity compensation;

WHEREAS, the Recipient Party has [completed the services/completed certain milestones/provided services for the specified time period] as required by the Contract; and

WHEREAS, the Business Party desires to grant equity to the Recipient Party in accordance with the terms of the Contract and this Equity Award Agreement (the "Agreement").

NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the parties agree as follows:

1. EQUITY AWARD
1.1 Grant of Equity. Subject to the terms and conditions of this Agreement, the Business Party hereby grants to the Recipient Party [number] [shares/units/percentage] of [type of equity, e.g., "Common Stock," "LLC Membership Units," etc.] in the Business Party (the "Equity Interest"), representing [percentage]% of the Business Party's [fully diluted/outstanding] [equity class].

1.2 Effective Date of Grant. The grant of the Equity Interest shall be effective as of the Effective Date stated above.

1.3 Equity Documentation. Within [number] days following the Effective Date, the Business Party shall deliver to the Recipient Party all necessary documentation evidencing the Equity Interest, which may include, as applicable:
a) Stock certificates or evidence of book entry shares;
b) Updated operating agreement, bylaws, or other governing documents;
c) Updated cap table reflecting the Recipient Party's ownership; and/or
d) Any other documentation reasonably necessary to evidence the Recipient Party's ownership of the Equity Interest.

1.4 Unregistered Business Entities. If the Business Party is not yet a formally registered business entity, the Business Party agrees to:
a) Provide written acknowledgment of the Recipient Party's equity interest;
b) Include the Recipient Party in the formation documentation when the business entity is formally established;
c) Issue proper equity documentation to the Recipient Party within [30] days of formal business registration; and
d) Ensure that all future investors and stakeholders are informed of the Recipient Party's equity interest.

2. TERMS OF EQUITY OWNERSHIP
2.1 Rights and Restrictions. The Equity Interest shall be subject to all rights, restrictions, and obligations set forth in:
a) This Agreement;
b) The Business Party's governing documents, as they exist now or may be amended in the future; and
c) Any applicable shareholders' agreement, investors' rights agreement, right of first refusal and co-sale agreement, voting agreement, or similar agreements to which the Business Party's equity holders are generally subject (collectively, the "Equity Documents").

2.2 Voting Rights. The Recipient Party shall have voting rights with respect to the Equity Interest as provided in the Equity Documents, or if such documents do not yet exist, in accordance with standard voting rights for the class of equity granted.

2.3 Economic Rights. The Recipient Party shall be entitled to participate in distributions, dividends, or other economic benefits with respect to the Equity Interest as provided in the Equity Documents, or if such documents do not yet exist, in accordance with standard economic rights for the class of equity granted.

2.4 Transfer Restrictions. The Recipient Party shall not sell, transfer, assign, pledge, or otherwise dispose of the Equity Interest except in compliance with:
a) All applicable securities laws;
b) The terms of the Equity Documents; and
c) The transfer restrictions set forth in Section 3 below.

3. TRANSFER RESTRICTIONS
3.1 Right of First Refusal. Prior to any proposed transfer of the Equity Interest (other than Permitted Transfers as defined below), the Recipient Party shall first offer the Equity Interest to the Business Party and/or its designees pursuant to procedures that are reasonable and customary for the type of business entity involved.

3.2 Co-Sale Rights. Any proposed transfer of the Equity Interest may be subject to co-sale rights of other equity holders as may be established in the Equity Documents.

3.3 Drag-Along Rights. The Recipient Party agrees to vote the Equity Interest in favor of, and otherwise consent to and raise no objections against, any Sale of the Business Party approved by the governing body (e.g., Board of Directors/Managers) and/or the requisite majority of equity holders as may be specified in the Equity Documents.

3.4 Permitted Transfers. The Recipient Party may transfer the Equity Interest without compliance with Sections 3.1 and 3.2 in the following circumstances:
a) Transfers to an immediate family member or trust for the benefit of the Recipient Party or immediate family members for estate planning purposes;
b) Transfers upon the death of the Recipient Party to the Recipient Party's estate or beneficiaries; or
c) Other transfers permitted by the governing body of the Business Party in its reasonable discretion.

4. REPRESENTATIONS AND WARRANTIES
4.1 Business Party Representations. The Business Party represents and warrants to the Recipient Party that:
a) The Business Party has all necessary power and authority to enter into this Agreement and to grant the Equity Interest to the Recipient Party;
b) The grant of the Equity Interest has been duly authorized by all necessary action on the part of the Business Party; and
c) The Equity Interest, when issued, will be duly and validly issued, fully paid, and non-assessable (where such concept is applicable).

4.2 Recipient Party Representations. The Recipient Party represents and warrants to the Business Party that:
a) The Recipient Party has the full right, power, and authority to enter into this Agreement;
b) The Recipient Party is acquiring the Equity Interest for the Recipient Party's own account for investment purposes only and not with a view to, or for resale in connection with, any distribution or public offering of the Equity Interest;
c) The Recipient Party has had an opportunity to ask questions and receive answers concerning the Business Party and the Equity Interest and has had full access to such other information concerning the Business Party as the Recipient Party has requested; and
d) The Recipient Party understands that the Equity Interest has not been registered under applicable securities laws and may not be sold or transferred absent such registration or an applicable exemption therefrom.

5. TAX MATTERS
5.1 Tax Consequences. The Recipient Party acknowledges that:
a) The acquisition, ownership, and disposition of the Equity Interest may have significant tax consequences for the Recipient Party;
b) The Business Party has advised the Recipient Party to consult with the Recipient Party's own tax advisors regarding such tax consequences; and
c) The Recipient Party is not relying on the Business Party or any of its representatives for tax advice.

5.2 Tax Election. If the Equity Interest is subject to vesting or substantial risk of forfeiture under applicable tax laws, the Recipient Party may be eligible to file a tax election. The Recipient Party acknowledges that the decision whether to file such an election is the Recipient Party's responsibility, and the Business Party is not providing any recommendation regarding such election.

5.3 Tax Withholding. To the extent the Business Party is required to withhold any taxes in connection with the grant of the Equity Interest, the Recipient Party shall make arrangements satisfactory to the Business Party to pay any such taxes.

6. COMPLIANCE WITH SECURITIES LAWS
6.1 Restricted Securities. The Recipient Party understands and acknowledges that:
a) The Equity Interest may constitute "restricted securities" as defined in applicable securities laws;
b) The Equity Interest may not be sold, transferred, or otherwise disposed of without registration under applicable securities laws, or an exemption therefrom; and
c) The certificates or book entries representing the Equity Interest may bear legends reflecting these restrictions.

6.2 No Registration Obligation. The Business Party shall have no obligation to register the Equity Interest under any securities laws, or to take any action to make any exemption from registration available.

7. JOINDER TO EXISTING AGREEMENTS
7.1 Joinder. By executing this Agreement, the Recipient Party hereby agrees to be bound by the terms of any existing agreements to which the Business Party's equity holders are generally subject, to the extent such agreements exist at the time of execution of this Agreement or are created in the future.

7.2 Delivery of Joinder Agreements. The Recipient Party agrees to promptly execute and deliver any separate joinder agreements that the Business Party may reasonably request to evidence the Recipient Party's joinder to existing or future agreements.

8. PROJECT RESTRICTION
8.1 Limited Use of Work Product. The Business Party acknowledges and agrees that the Work Product (as defined in the Contract) provided by the Recipient Party may only be used for the specific project described in the Contract (the "Project") and shall not be used, repurposed, or incorporated into any other project, product, or service not directly related to the Project without the Recipient Party's prior written consent and appropriate additional compensation.

8.2 Confirmation of Deliverables. The Business Party confirms that the Equity Interest granted herein is in consideration for the following completed deliverables or services: [description of completed work that forms the basis for this equity award].

9. DISPUTE RESOLUTION
9.1 Good Faith Negotiation. The parties agree to attempt in good faith to resolve any dispute arising out of or relating to this Agreement promptly by negotiation between representatives who have authority to settle the controversy.

9.2 Mediation. If the dispute cannot be settled through direct negotiations, the parties agree to try in good faith to settle the dispute by mediation administered by a mutually agreed upon neutral third party before resorting to arbitration, litigation, or some other dispute resolution procedure.

9.3 Arbitration or Court Proceedings. If the parties cannot resolve the dispute through negotiation or mediation, either party may initiate arbitration or court proceedings. The parties may agree on the selection of a mutually acceptable arbitrator and arbitration rules. If the parties do not reach such agreement within 30 days of the initiation of the dispute resolution process, either party may commence proceedings in a court of competent jurisdiction.

10. GENERAL PROVISIONS
10.1 Choice of Forum. Any dispute arising out of or relating to this Agreement shall be resolved in a forum of the Business Party's choosing, selected from the following options: (a) the courts of the jurisdiction where the Business Party has its principal place of business, (b) arbitration in a location chosen by the Business Party according to the rules of [major international arbitration organization], or (c) such other forum as the parties may agree upon in writing.

10.2 Assignment. This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns. The Recipient Party may not assign any of the Recipient Party's rights or obligations under this Agreement without the prior written consent of the Business Party.

10.3 Entire Agreement. This Agreement, together with the Contract and the Equity Documents, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, proposals, or representations, written or oral, concerning its subject matter.

10.4 Amendment. This Agreement may only be amended by a written instrument executed by both parties.

10.5 Severability. If any provision of this Agreement is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this Agreement shall otherwise remain in full force and effect.

10.6 No Waiver. No failure or delay by either party in exercising any right under this Agreement shall operate as a waiver of such right or any other right.

10.7 Notices. All notices required or permitted under this Agreement shall be in writing and shall be deemed effective upon personal delivery, upon confirmation of receipt if transmitted by email, or three (3) days after delivery by internationally recognized courier service to the addresses set forth above or to such other address as either party may specify in writing.

10.8 Counterparts and Electronic Signatures. This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed to be original signatures for all purposes.

10.9 Independent Legal Advice. Each party acknowledges that it has had the opportunity to seek independent legal advice prior to executing this Agreement.

10.10 Sweaquity Disclaimer. The parties acknowledge that Sweaquity has facilitated the connection between the Business Party and the Recipient Party but is not a party to this Agreement. SWEAQUITY SHALL NOT BE LIABLE FOR ANY ISSUES, DISPUTES, OR CLAIMS ARISING BETWEEN THE PARTIES RELATED TO THIS AGREEMENT, INCLUDING BUT NOT LIMITED TO DISPUTES REGARDING THE EQUITY INTEREST, TAX CONSEQUENCES, OR COMPLIANCE WITH APPLICABLE LAWS.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

BUSINESS PARTY:
[BUSINESS NAME/PROJECT NAME]

Signature: ________________________
Name: ___________________________
Title/Role: _______________________
Date: ____________________________

RECIPIENT PARTY:
[JOBSEEKER NAME]

Signature: ________________________
Date: ____________________________

EXHIBIT A: DESCRIPTION OF EQUITY INTEREST
Type of Entity: [Corporation/LLC/Partnership/Other/Not Yet Formed]

Type of Equity: [Common Stock/Preferred Stock/Membership Units/Future Equity Rights/Other]

Number of Shares/Units: [Number] [if applicable]

Percentage Ownership: [percentage]% of the Business Party's [fully diluted/outstanding] [equity class]

Basis for Equity Award: [Reference to completed milestones, hours worked, or other basis for the award under the Contract]

Vesting Status: [Fully vested/Subject to additional vesting conditions as follows: _______]

If Business Entity Not Yet Formed:
Expected entity type: [Corporation/LLC/Partnership/Other]
Expected formation date: [Approximate date]
Confirmation of equity percentage upon formation: [percentage]%
Documentation to be provided upon formation: [Description of future documentation]

Additional Terms: [Any additional terms specific to this equity grant]`;
  }
}
