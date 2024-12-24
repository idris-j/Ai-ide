import { createContext, useContext, useState } from 'react';

interface FileContextType {
  currentFile: string | null;
  setCurrentFile: (path: string | null) => void;
  openFiles: string[];
  closeFile: (path: string) => void;
  addFile: (path: string) => Promise<void>;
  saveFile: (path: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const closeFile = (path: string) => {
    setOpenFiles((files) => files.filter((f) => f !== path));
    if (currentFile === path) {
      const remainingFiles = openFiles.filter((f) => f !== path);
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const addFile = async (path: string) => {
    try {
      // Check if file exists first
      const checkResponse = await fetch(`/api/files/exists?path=${encodeURIComponent(path)}`, {
        credentials: 'include'
      });

      if (!checkResponse.ok) {
        throw new Error('Failed to check file existence');
      }

      const exists = await checkResponse.json();

      if (!exists) {
        // Create new file if it doesn't exist
        const response = await fetch('/api/files/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path, content: '' }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create file');
        }
      }

      // Add to open files list if not already there
      setOpenFiles((files) => {
        if (!files.includes(path)) {
          return [...files, path];
        }
        return files;
      });

      // Set as current file
      setCurrentFile(path);

      // Create Monaco editor model for the new file
      const monaco = (window as any).monaco;
      if (monaco) {
        const uri = monaco.Uri.parse(path);
        const existingModel = monaco.editor.getModel(uri);

        if (!existingModel) {
          const fileExtension = path.split('.').pop() || '';
          const language = monaco.languages.getLanguages()
            .find((lang: any) =>
              lang.extensions?.some((ext: string) =>
                ext.toLowerCase() === `.${fileExtension.toLowerCase()}`
              )
            )?.id || 'plaintext';

          monaco.editor.createModel('', language, uri);
        }
      }

      // Trigger file tree refresh
      window.dispatchEvent(new CustomEvent('refresh-files'));
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  };

  const saveFile = async (path: string) => {
    try {
      const editor = (window as any).monaco?.editor
        .getModels()
        .find((model: any) => model.uri.path === path);

      if (!editor) {
        throw new Error('File not found in editor');
      }

      const content = editor.getValue();

      const response = await fetch(`/api/files/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      // Trigger file tree refresh after save
      window.dispatchEvent(new CustomEvent('refresh-files'));
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  return (
    <FileContext.Provider value={{ 
      currentFile, 
      setCurrentFile, 
      openFiles, 
      closeFile, 
      addFile,
      saveFile
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}