
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, BarChart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface TaskCardProps {
  id: string;
  projectId: string;
  title: string;
  description: string;
  equity: number;
  timeframe: string;
  skills: string[];
  matchedSkills: string[];
  matchScore: number;
  className?: string;
}

export function TaskCard({
  id,
  projectId,
  title,
  description,
  equity,
  timeframe,
  skills,
  matchedSkills,
  matchScore,
  className,
}: TaskCardProps) {
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        toast.error("Please sign in to apply for this task");
        navigate("/auth/seeker");
        return;
      }
      
      // Navigate to the application page with task ID in location state
      console.log("Navigating to apply page with projectId:", projectId, "and taskId:", id);
      navigate(`/projects/${projectId}/apply`, { 
        state: { taskId: id }
      });
    } catch (error) {
      console.error("Error navigating to application page:", error);
      toast.error("Failed to open application page");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <div>
            <span className="text-xl">{title}</span>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 mr-1" />
              <span>{equity}% equity</span>
              <Calendar className="h-4 w-4 ml-3 mr-1" />
              <span>{timeframe}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <BarChart className="h-4 w-4 mr-1 text-primary" />
              <span className="font-semibold">{matchScore}% match</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{description}</p>
        <div>
          <p className="text-sm font-medium mb-2">Skills needed:</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => {
              const isMatch = matchedSkills.includes(skill);
              return (
                <Badge key={index} variant={isMatch ? "default" : "secondary"}>
                  {skill} {isMatch && "✓"}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleApply} 
          className="w-full"
          disabled={isApplying}
        >
          {isApplying ? "Loading..." : "Apply Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
