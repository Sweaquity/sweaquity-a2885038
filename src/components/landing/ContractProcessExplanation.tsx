
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart, Clock, FileCheck, FileText, MessageSquare, Rocket } from "lucide-react";

export const ContractProcessExplanation = () => {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="text-center mb-8">
        <CardTitle className="text-2xl md:text-3xl">The Contract Agreement Process</CardTitle>
        <CardDescription className="text-lg">
          How businesses and job seekers collaborate and form equity agreements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Initial Matching</h3>
              <p className="text-muted-foreground">
                Job seekers apply to projects based on their skills and interests. Businesses review applications and accept suitable candidates.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Equity Negotiation</h3>
              <p className="text-muted-foreground">
                Both parties discuss and agree on equity terms through the platform's messaging system. The details are recorded in the system.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Contract Generation</h3>
              <p className="text-muted-foreground">
                A formal agreement is generated outlining project requirements, deliverables, timelines, and equity stakes. Both parties sign digitally.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Project Execution</h3>
              <p className="text-muted-foreground">
                Work begins with tasks organized in a Kanban-style board. Job seekers update progress regularly through the platform.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Time Tracking</h3>
              <p className="text-muted-foreground">
                Hours worked are logged against specific tasks. The system calculates earned equity based on completion percentage and time invested.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Equity Tracking</h3>
              <p className="text-muted-foreground">
                Both parties can view dashboards showing equity earned vs. agreed allocation, with real-time updates as work progresses.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border p-6 rounded-lg bg-slate-50">
          <h3 className="text-xl font-semibold mb-4">Future Development: Task Management</h3>
          <div className="space-y-4">
            <p>
              The Sweaquity platform is actively developing enhanced project management features to better track and manage equity projects:
            </p>
            
            <ul className="list-disc ml-6 space-y-2">
              <li>Advanced Kanban board for visual task management</li>
              <li>Gantt charts for timeline visualization and project planning</li>
              <li>Time tracking integration for accurate equity calculations</li>
              <li>Progress reporting and milestone tracking</li>
              <li>Document storage for deliverables and supporting materials</li>
              <li>Automated equity calculations based on completed work</li>
            </ul>
            
            <div className="flex items-center gap-2 text-primary font-medium mt-4">
              <span>Stay tuned for these upcoming features</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
