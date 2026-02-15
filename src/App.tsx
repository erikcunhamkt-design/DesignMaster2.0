import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudiosPage from "./pages/StudiosPage";
import Index from "./pages/Index";
import ExtractorPage from "./pages/ExtractorPage";
import PromptBuilderPage from "./pages/PromptBuilderPage";
import UpscalePage from "./pages/UpscalePage";
import MarkdownGeneratorPage from "./pages/MarkdownGeneratorPage";
import ProductsStudioPage from "./pages/ProductsStudioPage";
import MagneticCoversPage from "./pages/MagneticCoversPage";
import PromptGalleryPage from "./pages/PromptGalleryPage";
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
            <Route path="/" element={<StudiosPage />} />
            <Route path="/studio/criador" element={<Index />} />
            <Route path="/studio/extrator" element={<ExtractorWrapper />} />
            <Route path="/studio/prompt-builder" element={<PromptBuilderPage />} />
            <Route path="/studio/upscale" element={<UpscalePage />} />
            <Route path="/studio/markdown" element={<MarkdownGeneratorPage />} />
            <Route path="/studio/produtos" element={<ProductsStudioPage />} />
            <Route path="/studio/capas" element={<MagneticCoversPage />} />
            <Route path="/studio/galeria" element={<PromptGalleryPage />} />
            {/* Legacy route redirect */}
            <Route path="/criar/:creatorId" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Wrap ExtractorPage with StudioTopbar
import { StudioTopbar } from "./components/layout/StudioTopbar";

function ExtractorWrapper() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Extrator de Prompts" showApiKey={false} />
      <div className="flex flex-1 overflow-hidden">
        <ExtractorPage />
      </div>
    </div>
  );
}

export default App;
