import { Route, Switch } from 'wouter';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sidebar } from '@/components/Sidebar';
import { CodeEditor } from '@/components/Editor';
import { AIPanel } from '@/components/AIPanel';
import { Terminal } from '@/components/Terminal';
import { MenuBar } from '@/components/MenuBar';
import { TabsView } from '@/components/TabsView';
import { ThemeProvider } from '@/lib/theme-context';
import { FileProvider } from '@/lib/file-context';
import { AuthPage } from '@/components/AuthPage';
import { LandingPage } from '@/components/LandingPage';
import { CommandPalette } from '@/components/CommandPalette';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function IDELayout() {
  const [showTerminal, setShowTerminal] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <MenuBar 
        onToggleTerminal={() => setShowTerminal(prev => !prev)} 
      />
      <CommandPalette />
      <div className="flex-1 relative">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full rounded-lg bg-background"
        >
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={25}
            className="bg-sidebar-background p-2"
          >
            <Sidebar onFileSelect={setCurrentFilePath} />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border" />

          <ResizablePanel 
            defaultSize={50}
            className="bg-editor-bg flex flex-col"
          >
            <TabsView />
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <CodeEditor filePath={currentFilePath} />
              </ResizablePanel>

              {showTerminal && (
                <>
                  <ResizableHandle withHandle className="bg-border" />
                  <ResizablePanel
                    defaultSize={30}
                    minSize={20}
                    className="bg-background"
                  >
                    <div id="terminal-panel" className="w-full h-full">
                      <Terminal className="w-full h-full p-2" />
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border" />

          <ResizablePanel 
            defaultSize={30}
            className="bg-card"
          >
            <AIPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function App() {
  const { isLoading } = useUser();
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <FileProvider>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/editor">
            {() => (
              <ProtectedRoute>
                <IDELayout />
              </ProtectedRoute>
            )}
          </Route>
          <Route>
            {() => {
              setLocation('/');
              return null;
            }}
          </Route>
        </Switch>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;