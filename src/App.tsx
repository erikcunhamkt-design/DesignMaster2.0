import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreatorSelectPage from "./pages/CreatorSelectPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SplashIntro, shouldShowIntro } from "./components/SplashIntro";

const queryClient = new QueryClient();

const App = () => {
  const [showIntro, setShowIntro] = useState(shouldShowIntro);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showIntro && <SplashIntro onComplete={() => setShowIntro(false)} />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CreatorSelectPage />} />
            <Route path="/criar/:creatorId" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
