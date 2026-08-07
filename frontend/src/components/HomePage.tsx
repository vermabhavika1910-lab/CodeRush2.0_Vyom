import { PromptComposer } from '@/components/PromptComposer';
import { RightSidebar } from '@/components/RightSidebar';

interface HomePageProps {
  onOpenWorkflow: () => void;
  onSubmitPrompt?: (prompt: string) => void;
}

export function HomePage({ onOpenWorkflow, onSubmitPrompt }: HomePageProps) {
  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-5 sm:p-8 lg:p-10">
        <PromptComposer onSubmitPrompt={onSubmitPrompt} />
      </div>
      <RightSidebar onOpenWorkflow={onOpenWorkflow} />
    </div>
  );
}
