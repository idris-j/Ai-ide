import { useRef, useEffect, useState } from 'react';
import Editor from "@monaco-editor/react";
import { Card } from '@/components/ui/card';
import type * as Monaco from 'monaco-editor';
import { useFile } from '@/lib/file-context';

interface CodeEditorProps {
  filePath?: string | null;
}

export function CodeEditor({ filePath }: CodeEditorProps) {
  const [content, setContent] = useState<string>('');
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!filePath) return;

      try {
        const response = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        }
      } catch (error) {
        console.error('Failed to fetch file content:', error);
        setContent(`// Error loading ${filePath}\n// ${error}`);
      }
    };

    fetchContent();
  }, [filePath]);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Store editor reference
    editorRef.current = editor;

    // Handle editor layout updates
    const container = editor.getContainerDomNode().parentElement;
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        // Use RAF to ensure all DOM updates are complete
        requestAnimationFrame(() => {
          const { width, height } = container.getBoundingClientRect();
          editor.layout({ width, height });
        });
      });

      resizeObserver.observe(container);

      // Store cleanup function for unmounting
      (editor as any)._cleanup = () => {
        resizeObserver.disconnect();
      };
    }

    // Add editor change listener
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      // Get the WebSocket instance from window
      const ws = (window as any).aiWebSocket;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'analyze',
          content: value,
          fileName: filePath
        }));
      }
    });

    // Store editor instance in a way that's accessible to other components
    (window as any).monaco = {
      ...(window as any).monaco,
      editor: {
        ...(window as any).monaco?.editor,
        getActiveEditor: () => editor
      }
    };
  };

  if (!filePath) {
    return (
      <Card className="h-full w-full rounded-none border-0 bg-background flex items-center justify-center text-muted-foreground">
        Select a file to edit
      </Card>
    );
  }

  return (
    <Card className="h-full w-full rounded-none border-0 bg-background">
      <div className="h-full w-full relative overflow-hidden">
        <Editor
          defaultLanguage="typescript"
          value={content}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            quickSuggestions: true,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            automaticLayout: false,
            fixedOverflowWidgets: true,
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false
            }
          }}
          onMount={handleEditorDidMount}
          className="absolute inset-0"
        />
      </div>
    </Card>
  );
}