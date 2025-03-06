
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TermsAndConditionsLink = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-blue-600 hover:text-blue-800">
          terms and conditions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">1. Introduction</h2>
            <p>
              Welcome to our platform that connects job seekers, businesses, and recruiters in an equity-based 
              collaboration environment. These Terms and Conditions govern your use of our platform and services.
            </p>

            <h2 className="text-lg font-bold">2. Definitions</h2>
            <p>
              <strong>Platform:</strong> Refers to our website, mobile applications, and services.<br />
              <strong>User:</strong> Any individual or entity that accesses or uses our Platform.<br />
              <strong>Job Seeker:</strong> A User who is looking for opportunities to contribute skills in exchange for equity.<br />
              <strong>Business:</strong> A User who is offering equity in exchange for services or skills.<br />
              <strong>Recruiter:</strong> A User who facilitates connections between Job Seekers and Businesses.
            </p>

            <h2 className="text-lg font-bold">3. Account Registration</h2>
            <p>
              3.1. To use certain features of the Platform, you must create an account.<br />
              3.2. You agree to provide accurate and complete information during registration.<br />
              3.3. You are responsible for maintaining the confidentiality of your account credentials.<br />
              3.4. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2 className="text-lg font-bold">4. Equity Agreements</h2>
            <p>
              4.1. Our Platform facilitates equity-based agreements between Users.<br />
              4.2. We do not guarantee any specific outcome or value of equity arrangements.<br />
              4.3. Users are responsible for understanding the legal and financial implications of equity agreements.<br />
              4.4. We recommend consulting with legal and financial professionals before entering into any equity agreement.
            </p>

            <h2 className="text-lg font-bold">5. User Conduct</h2>
            <p>
              5.1. You agree not to use the Platform for any illegal purpose.<br />
              5.2. You will not misrepresent your identity or qualifications.<br />
              5.3. You will not post false, misleading, or deceptive content.<br />
              5.4. You will not harass, abuse, or harm other Users.
            </p>

            <h2 className="text-lg font-bold">6. Content</h2>
            <p>
              6.1. You retain ownership of the content you submit to the Platform.<br />
              6.2. By submitting content, you grant us a non-exclusive, worldwide license to use, reproduce, modify, publish, and distribute your content.<br />
              6.3. You are solely responsible for the content you post.
            </p>

            <h2 className="text-lg font-bold">7. Privacy</h2>
            <p>
              7.1. Our collection and use of personal information is governed by our Privacy Policy.<br />
              7.2. By using the Platform, you consent to our collection and use of personal information as described in the Privacy Policy.
            </p>

            <h2 className="text-lg font-bold">8. Intellectual Property</h2>
            <p>
              8.1. The Platform and its content are protected by copyright, trademark, and other laws.<br />
              8.2. Our name, logo, and all related names, logos, product and service names, designs, and slogans are our trademarks.<br />
              8.3. You may not use our trademarks without our prior written permission.
            </p>

            <h2 className="text-lg font-bold">9. Termination</h2>
            <p>
              9.1. We may terminate or suspend your account and access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other Users, us, or third parties, or for any other reason.<br />
              9.2. Upon termination, your right to use the Platform will immediately cease.
            </p>

            <h2 className="text-lg font-bold">10. Disclaimer of Warranties</h2>
            <p>
              10.1. The Platform is provided "as is" and "as available" without any warranties of any kind.<br />
              10.2. We do not guarantee that the Platform will be uninterrupted, timely, secure, or error-free.
            </p>

            <h2 className="text-lg font-bold">11. Limitation of Liability</h2>
            <p>
              11.1. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.<br />
              11.2. Our total liability to you for any claim arising out of or relating to these Terms or the Platform shall not exceed the amount paid by you to us during the 12 months preceding the claim.
            </p>

            <h2 className="text-lg font-bold">12. Changes to Terms</h2>
            <p>
              12.1. We may revise these Terms at any time by posting an updated version on the Platform.<br />
              12.2. Your continued use of the Platform after any changes constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-lg font-bold">13. Governing Law</h2>
            <p>
              13.1. These Terms shall be governed by and construed in accordance with the laws of the United Kingdom.<br />
              13.2. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of the United Kingdom.
            </p>

            <h2 className="text-lg font-bold">14. Contact Information</h2>
            <p>
              14.1. If you have any questions about these Terms, please contact us at support@example.com.
            </p>

            <p className="text-sm text-gray-600 mt-8">Last updated: July 26, 2024</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
