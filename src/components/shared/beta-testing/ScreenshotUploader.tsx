
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import html2canvas from 'html2canvas';
import { toast } from "sonner";

interface ScreenshotUploaderProps {
  screenshotPreviews: string[];
  setScreenshotPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  screenshots: File[];
  setScreenshots: React.Dispatch<React.SetStateAction<File[]>>;
}

export function ScreenshotUploader({
  screenshotPreviews,
  setScreenshotPreviews,
  screenshots,
  setScreenshots
}: ScreenshotUploaderProps) {
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit the number of files to prevent performance issues
      if (screenshots.length + newFiles.length > 5) {
        toast.warning("Maximum 5 screenshots allowed. Only the first ones will be added.");
        newFiles.splice(0, 5 - screenshots.length);
      }
      
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
      
      // Wait a bit for any open dialogs to close
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the screen
      const canvas = await html2canvas(document.body);
      const dataUrl = canvas.toDataURL('image/png');
      
      // Convert to File object
      const blobBin = atob(dataUrl.split(',')[1]);
      const array = [];
      for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      const file = new File([new Uint8Array(array)], `screenshot_${Date.now()}.png`, {type: 'image/png'});
      
      // Check if we have room for more screenshots
      if (screenshots.length >= 5) {
        toast.warning("Maximum 5 screenshots allowed. Please remove some before adding more.");
        setIsCapturingScreenshot(false);
        return;
      }
      
      // Add the new screenshot
      setScreenshots(prev => [...prev, file]);
      setScreenshotPreviews(prev => [...prev, dataUrl]);
      
      toast.success("Screenshot captured successfully!");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast.error("Failed to capture screenshot");
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="mb-2 block">Attach Screenshots (max 5)</Label>
      <div className="flex gap-2 mb-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={screenshots.length >= 5}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={captureScreenshot}
          disabled={isCapturingScreenshot || screenshots.length >= 5}
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
  );
}
