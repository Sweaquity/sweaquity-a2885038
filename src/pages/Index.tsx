
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
