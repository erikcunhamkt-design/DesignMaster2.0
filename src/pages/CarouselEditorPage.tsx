import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { CarouselEditor } from '@/components/carousel-editor/CarouselEditor';

export default function CarouselEditorPage() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Carrossel Editor" showApiKey={false} />
      <div className="flex-1 overflow-hidden">
        <CarouselEditor />
      </div>
    </div>
  );
}
