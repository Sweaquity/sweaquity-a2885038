
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Building2, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

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
    },
    {
      title: "Recruiter",
      description: "Connect talented professionals with great companies",
      icon: Users,
      type: "recruiter"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-transition">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Sweaquity
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose your role to get started on your professional journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        {userTypes.map((type) => (
          <Card
            key={type.type}
            className="landing-card group cursor-pointer"
            onClick={() => navigate(`/register/${type.type}`)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-accent/10 text-accent">
                <type.icon size={24} />
              </div>
              <h2 className="text-xl font-semibold mb-2">{type.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {type.description}
              </p>
              <Button
                variant="ghost"
                className="group-hover:translate-x-1 transition-transform"
              >
                Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
