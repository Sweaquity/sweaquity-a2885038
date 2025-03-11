
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Check, Clock, FileText, Layers, Pencil, User, Users } from "lucide-react";

export const RegistrationProcess = () => {
  const steps = [
    {
      title: "Create an Account",
      description: "Sign up as a Job Seeker, Business, or Recruiter to access platform features.",
      icon: <User className="h-10 w-10 text-primary" />
    },
    {
      title: "Complete Your Profile",
      description: "Fill in your personal or business details and preferences for better matching.",
      icon: <Pencil className="h-10 w-10 text-primary" />
    },
    {
      title: "Upload Your CV (Job Seekers)",
      description: "Job Seekers upload and parse their CV to populate their skills automatically.",
      icon: <FileText className="h-10 w-10 text-primary" />
    },
    {
      title: "Create Projects (Businesses)",
      description: "Businesses create equity projects with specific tasks and skill requirements.",
      icon: <Layers className="h-10 w-10 text-primary" />
    },
    {
      title: "Apply for Projects",
      description: "Job Seekers browse and apply for projects that match their skills and interests.",
      icon: <Users className="h-10 w-10 text-primary" />
    },
    {
      title: "Contract Agreement",
      description: "Once accepted, both parties agree on equity terms and sign a contract.",
      icon: <Check className="h-10 w-10 text-primary" />
    },
    {
      title: "Track Progress",
      description: "Track project completion and equity earned through the dashboard.",
      icon: <Clock className="h-10 w-10 text-primary" />
    }
  ];

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">How Sweaquity Works</CardTitle>
        <CardDescription className="text-lg">
          Follow these simple steps to get started with skill-based equity exchange
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[24px] top-0 bottom-0 w-1 bg-muted" />
          <ol className="space-y-8 relative">
            {steps.map((step, index) => (
              <li key={index} className="grid grid-cols-[48px_1fr] gap-5 items-start">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted z-10">
                  {step.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold leading-snug text-lg">Step {index + 1}: {step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
