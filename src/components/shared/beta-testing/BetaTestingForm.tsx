
import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { ScreenshotUploader } from "./ScreenshotUploader";
import { SystemInfo } from "./SystemInfo";
import { supabase } from "@/lib/supabase";

interface ProjectSubTask {
  id: string;
  title: string;
}

interface SystemLogInfo {
  url: string;
  userAgent: string;
  timestamp: string;
  viewportSize: string;
  referrer: string;
}

interface BetaTestingFormProps {
  onClose: () => void;
  onSubmit: (formData: {
    errorLocation: string;
    severity: string;
    selectedSubTaskId: string;
    description: string;
    screenshots: File[];
    systemInfo: SystemLogInfo | null;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function BetaTestingForm({ onClose, onSubmit, isSubmitting }: BetaTestingFormProps) {
  const [description, setDescription] = useState('');
  const [errorLocation, setErrorLocation] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemLogInfo | null>(null);
  const [projectSubTasks, setProjectSubTasks] = useState<ProjectSubTask[]>([]);
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string>('');
  const [isLoadingSubTasks, setIsLoadingSubTasks] = useState(false);
  
  // Project ID in state to make it easily configurable and reusable
  const [projectId, setProjectId] = useState('1ec133ba-26d6-4112-8e44-f0b67ddc8fb4');

  useEffect(() => {
    fetchProjectSubTasks();
    
    const info: SystemLogInfo = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer || 'Direct'
    };
    setSystemInfo(info);
    
    if (!errorLocation) {
      const pathParts = window.location.pathname.split('/');
      const pageName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'Home';
      setErrorLocation(pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' '));
    }
  }, [errorLocation]);

  const fetchProjectSubTasks = async () => {
    try {
      setIsLoadingSubTasks(true);
      
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('task_id, title')
        .eq('project_id', projectId);
      
      if (error) {
        console.error("Error fetching project sub-tasks:", error);
        return;
      }
      
      if (data) {
        const mappedData = data.map(task => ({
          id: task.task_id,
          title: task.title
        }));
        
        setProjectSubTasks(mappedData);
        if (mappedData.length > 0) {
          setSelectedSubTaskId(mappedData[0].id);
        }
      }
    } catch (error) {
      console.error("Error in fetchProjectSubTasks:", error);
    } finally {
      setIsLoadingSubTasks(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return;
    }
    
    await onSubmit({
      errorLocation,
      severity,
      selectedSubTaskId,
      description,
      screenshots,
      systemInfo
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="errorLocation">Where did you find this issue?</Label>
          <Input 
            id="errorLocation" 
            placeholder="e.g., Dashboard, Project page, etc."
            value={errorLocation}
            onChange={(e) => setErrorLocation(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger id="severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Minor issue</SelectItem>
              <SelectItem value="medium">Medium - Affects functionality</SelectItem>
              <SelectItem value="high">High - Critical issue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subTask">Related Project Sub-Task</Label>
        <Select 
          value={selectedSubTaskId} 
          onValueChange={setSelectedSubTaskId}
          disabled={isLoadingSubTasks || projectSubTasks.length === 0}
        >
          <SelectTrigger id="subTask">
            <SelectValue placeholder={isLoadingSubTasks ? "Loading..." : "Select related sub-task"} />
          </SelectTrigger>
          <SelectContent>
            {projectSubTasks.length === 0 && !isLoadingSubTasks ? (
              <SelectItem value="no-subtasks">No sub-tasks available</SelectItem>
            ) : (
              projectSubTasks.map(task => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="errorDescription">Describe the issue</Label>
        <Textarea
          id="errorDescription"
          placeholder="Please describe what happened and the steps to reproduce the issue..."
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <ScreenshotUploader
        screenshots={screenshots}
        setScreenshots={setScreenshots}
        screenshotPreviews={screenshotPreviews}
        setScreenshotPreviews={setScreenshotPreviews}
      />
      
      <DialogFooter className="mt-6 mb-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !description.trim()}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Submitting...</span>
              <span className="animate-spin">⟳</span>
            </>
          ) : (
            "Submit Report"
          )}
        </Button>
      </DialogFooter>
      
      <SystemInfo systemInfo={systemInfo} />
    </div>
  );
}
