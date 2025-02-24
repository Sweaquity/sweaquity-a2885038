
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SeekerRegistration from "./pages/Register/Seeker";
import BusinessRegistration from "./pages/Register/Business";
import RecruiterRegistration from "./pages/Register/Recruiter";
import SeekerLogin from "./pages/Login/Seeker";
import BusinessLogin from "./pages/Login/Business";
import RecruiterLogin from "./pages/Login/Recruiter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register/seeker" element={<SeekerRegistration />} />
            <Route path="/register/business" element={<BusinessRegistration />} />
            <Route path="/register/recruiter" element={<RecruiterRegistration />} />
            <Route path="/login/seeker" element={<SeekerLogin />} />
            <Route path="/login/business" element={<BusinessLogin />} />
            <Route path="/login/recruiter" element={<RecruiterLogin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
