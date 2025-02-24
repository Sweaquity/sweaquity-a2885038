
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Building2, User } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const userTypes = [
    {
      title: "Job Seeker",
      description: "Find your next opportunity and showcase your skills",
      icon: User,
      type: "seeker"
    },
    {
      title: "Business",
      description: "Post jobs and find the perfect candidates",
      icon: Building2,
      type: "business"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-transition">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Sweaquity
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Choose your role to get started on your professional journey
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {userTypes.map((type) => (
          <Card
            key={type.type}
            className="p-6 landing-card"
          >
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-4 p-3 rounded-full bg-accent/10 text-accent">
                <type.icon size={24} />
              </div>
              <h2 className="text-xl font-semibold mb-2">{type.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {type.description}
              </p>
              <div className="mt-auto space-y-3 w-full">
                <Link to={`/register/${type.type}`} className="block w-full">
                  <Button className="w-full">
                    Sign Up <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to={`/login/${type.type}`} className="block w-full">
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Link to="/register/recruiter" className="mt-8">
        <Button variant="link" className="text-muted-foreground">
          Recruitment login here
        </Button>
      </Link>
    </div>
  );
};

export default Index;
