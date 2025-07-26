import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Camera, Upload, X, Code, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import html2canvas from 'html2canvas';

interface SystemLogInfo {
  url: string;
  userAgent: string;
  timestamp: string;
  viewportSize: string;
  referrer: string;
}

interface ProjectSubTask {
  id: string;
  title: string;
}

interface RelevantCodeFile {
  path: string;
  type: 'component' | 'page' | 'hook' | 'util' | 'api';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Route to file mapping - customize this based on your project structure
const ROUTE_TO_FILES_MAP: Record<string, RelevantCodeFile[]> = {
  '/dashboard': [
    { path: 'src/pages/Dashboard.tsx', type: 'page', confidence: 'high', reason: 'Main dashboard page' },
    { path: 'src/components/DashboardStats.tsx', type: 'component', confidence: 'high', reason: 'Dashboard statistics component' },
    { path: 'src/hooks/useDashboardData.ts', type: 'hook', confidence: 'medium', reason: 'Dashboard data fetching hook' },
  ],
  '/projects': [
    { path: 'src/pages/Projects.tsx', type: 'page', confidence: 'high', reason: 'Projects listing page' },
    { path: 'src/components/ProjectCard.tsx', type: 'component', confidence: 'high', reason: 'Individual project card component' },
    { path: 'src/components/ProjectFilters.tsx', type: 'component', confidence: 'medium', reason: 'Project filtering component' },
  ],
  '/project': [
    { path: 'src/pages/ProjectDetail.tsx', type: 'page', confidence: 'high', reason: 'Project detail page' },
    { path: 'src/components/ProjectTasks.tsx', type: 'component', confidence: 'high', reason: 'Project tasks component' },
    { path: 'src/components/TaskCard.tsx', type: 'component', confidence: 'medium', reason: 'Individual task component' },
  ],
  '/settings': [
    { path: 'src/pages/Settings.tsx', type: 'page', confidence: 'high', reason: 'Settings page' },
    { path: 'src/components/SettingsForm.tsx', type: 'component', confidence: 'high', reason: 'Settings form component' },
  ],
  // Add more routes as needed
};

// Common files that might be relevant to any issue
const COMMON_FILES: RelevantCodeFile[] = [
  { path: 'src/lib/supabase.ts', type: 'util', confidence: 'medium', reason: 'Database connection and queries' },
  { path: 'src/hooks/useAuth.ts', type: 'hook', confidence: 'medium', reason: 'Authentication logic' },
  { path: 'src/components/Layout.tsx', type: 'component', confidence: 'low', reason: 'Main layout component' },
  { path: 'src/utils/api.ts', type: 'api', confidence: 'medium', reason: 'API utilities and error handling' },
];

export function BetaTestingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [errorLocation, setErrorLocation] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemLogInfo | null>(null);
  const [projectSubTasks, setProjectSubTasks] = useState<ProjectSubTask[]>([]);
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string>('');
  const [isLoadingSubTasks, setIsLoadingSubTasks] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [relevantFiles, setRelevantFiles] = useState<RelevantCodeFile[]>([]);
  const [customFilePath, setCustomFilePath] = useState('');
  const [showCodeSection, setShowCodeSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState('1ec133ba-26d6-4112-8e44-f0b67ddc8fb4');

  // Function to detect relevant files based on current route
  const detectRelevantFiles = (): RelevantCodeFile[] => {
    const pathname = window.location.pathname;
    const detectedFiles: RelevantCodeFile[] = [];
    let foundExactMatch = false;
    
    // Check for exact route matches
    if (ROUTE_TO_FILES_MAP[pathname]) {
      detectedFiles.push(...ROUTE_TO_FILES_MAP[pathname]);
      foundExactMatch = true;
    }
    
    // Check for partial route matches (e.g., /project/123 matches /project)
    for (const [route, files] of Object.entries(ROUTE_TO_FILES_MAP)) {
      if (route !== pathname && pathname.startsWith(route + '/')) {
        detectedFiles.push(...files.map(file => ({
          ...file,
          confidence: file.confidence === 'high' ? 'medium' : 'low' as 'medium' | 'low',
          reason: `${file.reason} (partial route match)`
        })));
        foundExactMatch = true;
      }
    }
    
    // If no matches found, try to guess files based on route structure
    if (!foundExactMatch) {
      const guessedFiles = detectFilesForUnknownRoute(pathname);
      detectedFiles.push(...guessedFiles);
    }
    
    // Add common files that might be relevant
    detectedFiles.push(...COMMON_FILES);
    
    // Remove duplicates based on path
    const uniqueFiles = detectedFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.path === file.path)
    );
    
    // Sort by confidence (high first) and then by type
    return uniqueFiles.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const typeOrder = { page: 5, component: 4, hook: 3, api: 2, util: 1 };
      
      if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      }
      
      return typeOrder[b.type] - typeOrder[a.type];
    });
  };

  // Fallback function for routes not explicitly mapped
  const detectFilesForUnknownRoute = (pathname: string): RelevantCodeFile[] => {
    const detectedFiles: RelevantCodeFile[] = [];
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      // Root route
      detectedFiles.push(
        { path: 'src/pages/Home.tsx', type: 'page', confidence: 'medium', reason: 'Guessed home page' },
        { path: 'src/pages/Index.tsx', type: 'page', confidence: 'low', reason: 'Alternative home page' },
        { path: 'src/App.tsx', type: 'page', confidence: 'medium', reason: 'Root app component' }
      );
    } else {
      // Try to predict files based on route segments
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        const confidence = isLast ? 'medium' : 'low';
        
        // Convert kebab-case or snake_case to PascalCase
        const componentName = segment
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        
        if (isLast) {
          // Page prediction for the final segment
          detectedFiles.push({
            path: `src/pages/${componentName}.tsx`,
            type: 'page',
            confidence,
            reason: `Guessed page for /${segments.join('/')}`
          });
          
          // Component prediction
          detectedFiles.push({
            path: `src/components/${componentName}.tsx`,
            type: 'component',
            confidence: 'low',
            reason: `Guessed component for /${segment}`
          });
        }
      });
    }
    
    return detectedFiles;
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjectSubTasks();
      
      const info: SystemLogInfo = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || 'Direct'
      };
      setSystemInfo(info);
      
      // Detect relevant files
      const detectedFiles = detectRelevantFiles();
      setRelevantFiles(detectedFiles);
      
      if (!errorLocation) {
        const pathParts = window.location.pathname.split('/');
        const pageName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'Home';
        setErrorLocation(pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' '));
      }
    }
  }, [isOpen, errorLocation]);

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

  const addCustomFile = () => {
    if (customFilePath.trim()) {
      const newFile: RelevantCodeFile = {
        path: customFilePath.trim(),
        type: 'component', // Default type, could be made selectable
        confidence: 'medium',
        reason: 'Manually added by user'
      };
      
      // Check if file already exists
      if (!relevantFiles.find(f => f.path === newFile.path)) {
        setRelevantFiles([...relevantFiles, newFile]);
      }
      
      setCustomFilePath('');
    }
  };

  const removeFile = (path: string) => {
    setRelevantFiles(relevantFiles.filter(f => f.path !== path));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setScreenshots([...screenshots, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setScreenshotPreviews(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
    setScreenshotPreviews(screenshotPreviews.filter((_, i) => i !== index));
  };

  const captureScreenshot = async () => {
    try {
      setIsCapturingScreenshot(true);
      setIsOpen(false);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(document.body);
      const dataUrl = canvas.toDataURL('image/png');
      
      const blobBin = atob(dataUrl.split(',')[1]);
      const array = [];
      for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      const file = new File([new Uint8Array(array)], 'screenshot.png', {type: 'image/png'});
      
      setScreenshots(prev => [...prev, file]);
      setScreenshotPreviews(prev => [...prev, dataUrl]);
      
      setIsOpen(true);
      toast.success("Screenshot captured successfully!");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast.error("Failed to capture screenshot");
      setIsOpen(true);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please describe the error you encountered");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to report errors");
        return;
      }
      
      // Prepare relevant files data
      const relevantFilesData = {
        files: relevantFiles,
        detectionMetadata: {
          currentRoute: window.location.pathname,
          detectedAt: new Date().toISOString(),
          totalFilesDetected: relevantFiles.length,
          highConfidenceFiles: relevantFiles.filter(f => f.confidence === 'high').length
        }
      };
      
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: `Beta Testing Report: ${errorLocation || 'General Issue'}`,
          description: description,
          reporter: user.id,
          priority: severity,
          status: 'new',
          health: 'needs-review',
          system_info: systemInfo,
          reproduction_steps: description,
          ticket_type: 'beta_testing',
          notes: [],
          replies: [],
          task_id: selectedSubTaskId || null,
          project_id: projectId,
          relevant_files: relevantFilesData // Add the relevant files data
        })
        .select('id')
        .single();
      
      if (ticketError) {
        console.error("Error creating ticket:", ticketError);
        throw ticketError;
      }
      
      if (screenshots.length > 0 && ticketData?.id) {
        const uploadPromises = screenshots.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${ticketData.id}_${index}.${fileExt}`;
          const filePath = `${user.id}/${ticketData.id}/${fileName}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('ticket-attachments')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error("Error uploading screenshot:", uploadError);
            return null;
          }
          
          const { data: { publicUrl } } = supabase
            .storage
            .from('ticket-attachments')
            .getPublicUrl(filePath);
            
          return publicUrl;
        });
        
        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter(url => url !== null) as string[];
        
        if (validUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('tickets')
            .update({
              attachment_url: validUrls
            })
            .eq('id', ticketData.id);
            
          if (updateError) {
            console.error("Error updating ticket with screenshots:", updateError);
          }
        }
      }
      
      toast.success("Thank you for reporting this issue! Your feedback helps us improve the platform and earns you equity.");
      setDescription('');
      setErrorLocation('');
      setSeverity('medium');
      setScreenshots([]);
      setScreenshotPreviews([]);
      setSelectedSubTaskId('');
      setRelevantFiles([]);
      setCustomFilePath('');
      setShowCodeSection(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting beta test feedback:", error);
      toast.error("Failed to submit your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: RelevantCodeFile['type']) => {
    const colors = {
      page: 'bg-blue-100 text-blue-800',
      component: 'bg-green-100 text-green-800',
      hook: 'bg-purple-100 text-purple-800',
      api: 'bg-orange-100 text-orange-800',
      util: 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  const getConfidenceColor = (confidence: RelevantCodeFile['confidence']) => {
    const colors = {
      high: 'border-green-300',
      medium: 'border-yellow-300',
      low: 'border-gray-300'
    };
    return colors[confidence];
  };
      
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              onClick={() => setIsOpen(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Beta Issue
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Reporting Beta Issues earns equity in the Sweaquity project. Take a screenshot before reporting the issue.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Beta Testing Issue</DialogTitle>
            <DialogDescription>
              Reporting beta testing errors will earn you equity in Sweaquity. 
              Please attach a screenshot of the issue if possible.
            </DialogDescription>
          </DialogHeader>
          
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
            
            {/* Relevant Code Files Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Relevant Code Files ({relevantFiles.length} detected)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodeSection(!showCodeSection)}
                >
                  {showCodeSection ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {showCodeSection && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <p className="text-sm text-gray-600">
                    We've automatically detected files that might be related to this issue based on your current location. 
                    You can add or remove files as needed.
                  </p>
                  
                  {/* Add custom file */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom file path (e.g., src/components/MyComponent.tsx)"
                      value={customFilePath}
                      onChange={(e) => setCustomFilePath(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomFile()}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomFile}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* File list */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {relevantFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 border rounded ${getConfidenceColor(file.confidence)} bg-white`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className={getTypeColor(file.type)}>
                            {file.type}
                          </Badge>
                          <code className="text-sm font-mono truncate flex-1">{file.path}</code>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                {file.confidence}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{file.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.path)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {relevantFiles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No relevant files detected. Add some manually if needed.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="mb-2 block">Attach Screenshots</Label>
              <div className="flex gap-2 mb-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturingScreenshot ? "Capturing..." : "Capture Screen"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              {screenshotPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {screenshotPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Screenshot ${index + 1}`} 
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeScreenshot(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-6 mb-4">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
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
            
            {systemInfo && (
              <div className="space-y-2 bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">System Information (Automatically Collected)</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <p>Page: {systemInfo.url}</p>
                  <p>Time: {new Date(systemInfo.timestamp).toLocaleString()}</p>
                  <p>Screen: {systemInfo.viewportSize}</p>
                  <p>Referred from: {systemInfo.referrer}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
