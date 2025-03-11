
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RegistrationProcess } from "@/components/landing/RegistrationProcess";
import { ContractProcessExplanation } from "@/components/landing/ContractProcessExplanation";

const Index = () => {
  return (
    <div>
      <header className="bg-gradient-to-r from-primary/20 to-primary/10 py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Exchange <span className="text-primary">Skills</span> for <span className="text-primary">Equity</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connect job seekers with businesses looking to offer equity in exchange for skills and experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/seeker">
              <Button size="lg" className="w-full sm:w-auto">
                Find Projects
              </Button>
            </Link>
            <Link to="/auth/business">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Post Projects
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform makes it easy to connect talent with equity opportunities
            </p>
          </div>
          <RegistrationProcess />
        </section>

        <section className="mb-20">
          <ContractProcessExplanation />
        </section>

        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Registration Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting started with Sweaquity is simple and straightforward
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">1</div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">Sign Up</h3>
              <p className="text-muted-foreground text-center">
                Create your account as either a Job Seeker looking for opportunities or a Business looking to offer equity in exchange for skills.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">2</div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">Complete Your Profile</h3>
              <p className="text-muted-foreground text-center">
                Job Seekers: Upload your CV, add skills, and set preferences. Businesses: Add company details and create your first project with tasks.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">3</div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">Connect and Collaborate</h3>
              <p className="text-muted-foreground text-center">
                Job Seekers apply to projects that match their skills. Businesses review applications and select the right talent for their equity offerings.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contract & Equity Workflow</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              How agreements are managed and equity is earned
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Contract Generation Process</h3>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Application & Acceptance:</span> Job seeker applies to a project task, business reviews and accepts the application
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Negotiation Phase:</span> Both parties discuss and agree on equity terms, timeframes, and deliverables
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Contract Creation:</span> System generates a legal contract with all agreed terms, equity allocation, and responsibilities
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Digital Signing:</span> Both parties review and digitally sign the contract to formalize the agreement
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Storage & Access:</span> Signed contract is securely stored and accessible to both parties at any time
                </li>
              </ol>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Equity Earning System</h3>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Task Tracking:</span> Tasks are monitored through a Jira-style ticketing system with progress tracking
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Time & Effort Logging:</span> Job seekers log hours worked with descriptions of completed activities
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Progress Verification:</span> Business verifies and approves task completion percentages
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Equity Calculation:</span> System calculates earned equity based on completion percentage and agreed allocation
                </li>
                <li className="text-muted-foreground">
                  <span className="text-foreground font-medium">Dashboard Tracking:</span> Both parties can view real-time equity status, earned amounts, and outstanding equity
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-muted rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join our platform today and start exchanging skills for equity opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/seeker">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign Up as Job Seeker
                </Button>
              </Link>
              <Link to="/auth/business">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign Up as Business
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted-foreground/10 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} Sweaquity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
