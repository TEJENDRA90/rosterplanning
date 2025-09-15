
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RosterDetail from "./pages/RosterDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App  () {

  const getBasename = () => {
    const pathname = window.location.pathname;
    console.log('Current pathname:', pathname);
    const basePath = pathname.replace('/', '');
    console.log('Basename:', basePath);
    return basePath;
  };

  return(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/roster/:rosterCode" element={<RosterDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>)
};

export default App;
