import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import StudiosPage from "./pages/StudiosPage";
import AdminPage from "./pages/AdminPage";
import Index from "./pages/Index";
import ExtractorPage from "./pages/ExtractorPage";
import PromptBuilderPage from "./pages/PromptBuilderPage";
import UpscalePage from "./pages/UpscalePage";
import RestorePhotoPage from "./pages/RestorePhotoPage";
import MarkdownGeneratorPage from "./pages/MarkdownGeneratorPage";
import ProductsStudioPage from "./pages/ProductsStudioPage";
import MagneticCoversPage from "./pages/MagneticCoversPage";
import PromptGalleryPage from "./pages/PromptGalleryPage";
import DesignMasterChatPage from "./pages/DesignMasterChatPage";
import FootballArtsPage from "./pages/FootballArtsPage";
import FootballCreatorPage from "./pages/FootballCreatorPage";
import AutoCreatorPage from "./pages/AutoCreatorPage";
import MockupStudioPage from "./pages/MockupStudioPage";
import HeroStudioPage from "./pages/HeroStudioPage";
import CarouselMasterChatPage from "./pages/CarouselMasterChatPage";
import EditorialChatPage from "./pages/EditorialChatPage";
import CalendarChatPage from "./pages/CalendarChatPage";
import BioChatPage from "./pages/BioChatPage";
import NotFound from "./pages/NotFound";
import { SplashIntro, shouldShowIntro } from "./components/SplashIntro";
import { StudioTopbar } from "./components/layout/StudioTopbar";

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
            <Route path="/" element={<ProtectedRoute><StudiosPage /></ProtectedRoute>} />
            <Route path="/studio/criador" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/studio/extrator" element={<ProtectedRoute><ExtractorWrapper /></ProtectedRoute>} />
            <Route path="/studio/prompt-builder" element={<ProtectedRoute><PromptBuilderPage /></ProtectedRoute>} />
            <Route path="/studio/upscale" element={<ProtectedRoute><UpscalePage /></ProtectedRoute>} />
            <Route path="/studio/markdown" element={<ProtectedRoute><MarkdownGeneratorPage /></ProtectedRoute>} />
            <Route path="/studio/produtos" element={<ProtectedRoute><ProductsStudioPage /></ProtectedRoute>} />
            <Route path="/studio/capas" element={<ProtectedRoute><MagneticCoversPage /></ProtectedRoute>} />
            <Route path="/studio/galeria" element={<ProtectedRoute><PromptGalleryPage /></ProtectedRoute>} />
            <Route path="/studio/chat" element={<ProtectedRoute><DesignMasterChatPage /></ProtectedRoute>} />
            <Route path="/studio/football-arts" element={<ProtectedRoute><FootballArtsPage /></ProtectedRoute>} />
            <Route path="/studio/football-creator" element={<ProtectedRoute><FootballCreatorPage /></ProtectedRoute>} />
            <Route path="/studio/auto-creator" element={<ProtectedRoute><AutoCreatorPage /></ProtectedRoute>} />
            <Route path="/studio/mockup-studio" element={<ProtectedRoute><MockupStudioPage /></ProtectedRoute>} />
            <Route path="/studio/hero-studio" element={<ProtectedRoute><HeroStudioPage /></ProtectedRoute>} />
            <Route path="/studio/carousel-master" element={<ProtectedRoute><CarouselMasterChatPage /></ProtectedRoute>} />
            <Route path="/studio/restore-photo" element={<ProtectedRoute><RestorePhotoPage /></ProtectedRoute>} />
            <Route path="/studio/editorial" element={<ProtectedRoute><EditorialChatPage /></ProtectedRoute>} />
            <Route path="/studio/calendar" element={<ProtectedRoute><CalendarChatPage /></ProtectedRoute>} />
            <Route path="/studio/bio" element={<ProtectedRoute><BioChatPage /></ProtectedRoute>} />
            <Route path="/criar/:creatorId" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

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
