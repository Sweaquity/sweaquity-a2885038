
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ClipboardList, Clock, FileCheck, HandshakeIcon, PercentSquare } from "lucide-react";

export const ContractProcessExplanation = () => {
  const steps = [
    {
      title: "Project Task Agreement",
      description: "Once a job seeker is accepted for a project task, both parties negotiate equity terms for the work.",
      icon: <HandshakeIcon className="h-10 w-10 text-primary" />
    },
    {
      title: "Contract Generation",
      description: "A legal contract is automatically generated outlining the scope of work, deliverables, timeline, and equity compensation.",
      icon: <FileCheck className="h-10 w-10 text-primary" />
    },
    {
      title: "Task Progress Tracking",
      description: "Progress is tracked through a Jira-style ticketing system with task descriptions, hours logged, and completion percentage.",
      icon: <ClipboardList className="h-10 w-10 text-primary" />
    },
    {
      title: "Equity Earning",
      description: "As tasks are completed, job seekers earn proportional equity based on the agreed terms and verified completion percentage.",
      icon: <PercentSquare className="h-10 w-10 text-primary" />
    },
    {
      title: "Equity Management",
      description: "Both businesses and job seekers can track total equity allocated, earned, and potential through their dashboards.",
      icon: <Clock className="h-10 w-10 text-primary" />
    }
  ];

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl">Contract & Equity Process</CardTitle>
        <CardDescription className="text-lg">
          How agreements are managed and equity is earned on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="bg-card hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {step.icon}
                  </div>
                </div>
                <CardTitle className="text-center text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
