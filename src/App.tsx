import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { SplashIntro, shouldShowIntro } from "./components/SplashIntro";
import { StudioTopbar } from "./components/layout/StudioTopbar";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { useIpGuard } from "./hooks/useIpGuard";
import { IpBlockedScreen } from "./components/IpBlockedScreen";
import { PublicOrDashboard } from "./components/PublicOrDashboard";

// Lazy-loaded pages for code-splitting
const StudiosPage = lazy(() => import("./pages/StudiosPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const Index = lazy(() => import("./pages/Index"));
const ExtractorPage = lazy(() => import("./pages/ExtractorPage"));
const PromptBuilderPage = lazy(() => import("./pages/PromptBuilderPage"));
const UpscalePage = lazy(() => import("./pages/UpscalePage"));
const RestorePhotoPage = lazy(() => import("./pages/RestorePhotoPage"));
const MarkdownGeneratorPage = lazy(() => import("./pages/MarkdownGeneratorPage"));
const ProductsStudioPage = lazy(() => import("./pages/ProductsStudioPage"));
const MagneticCoversPage = lazy(() => import("./pages/MagneticCoversPage"));
const PromptGalleryPage = lazy(() => import("./pages/PromptGalleryPage"));
const DesignMasterChatPage = lazy(() => import("./pages/DesignMasterChatPage"));
const FootballArtsPage = lazy(() => import("./pages/FootballArtsPage"));
const FootballCreatorPage = lazy(() => import("./pages/FootballCreatorPage"));
const AutoCreatorPage = lazy(() => import("./pages/AutoCreatorPage"));
const MockupStudioPage = lazy(() => import("./pages/MockupStudioPage"));
const HeroStudioPage = lazy(() => import("./pages/HeroStudioPage"));
const CarouselMasterChatPage = lazy(() => import("./pages/CarouselMasterChatPage"));
const EditorialChatPage = lazy(() => import("./pages/EditorialChatPage"));
const CalendarChatPage = lazy(() => import("./pages/CalendarChatPage"));
const BioChatPage = lazy(() => import("./pages/BioChatPage"));
const CommunityChatPage = lazy(() => import("./pages/CommunityChatPage"));
const DirectMessagesPage = lazy(() => import("./pages/DirectMessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PortraitStudioPage = lazy(() => import("./pages/PortraitStudioPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => {
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const { checking, allowed, ip, message } = useIpGuard();

  if (checking) {
    return <PageLoader />;
  }

  if (allowed === false) {
    return <IpBlockedScreen ip={ip} message={message} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showIntro && <SplashIntro onComplete={() => setShowIntro(false)} />}
        <PWAInstallPrompt />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<PublicOrDashboard publicPage={<LandingPage />} dashboardPage={<ProtectedRoute><StudiosPage /></ProtectedRoute>} />} />
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
              <Route path="/studio/community-chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
              <Route path="/studio/direct-messages" element={<ProtectedRoute><DirectMessagesPage /></ProtectedRoute>} />
              <Route path="/studio/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/studio/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/criar/:creatorId" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/studio/changelog" element={<ProtectedRoute><ChangelogPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
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
