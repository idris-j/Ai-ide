import * as React from "react"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useTheme } from "@/lib/theme-context"
import { useFile } from "@/lib/file-context"
import { FileText, Save, FolderOpen, FileIcon, Copy, Scissors, Clipboard, RotateCcw, RotateCw, Terminal, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { useLocation } from 'wouter'

interface MenuBarProps {
  onToggleTerminal: () => void;
}

export function MenuBar({ onToggleTerminal }: MenuBarProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { currentFile, addFile, saveFile } = useFile();
  const { logout } = useUser();
  const [, setLocation] = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);
  const [isEditorSplit, setIsEditorSplit] = React.useState(false);

  const handleOpenFolder = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      (input as any).webkitdirectory = true;

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files?.length) {
          toast({
            title: 'Success',
            description: 'Folder opened successfully',
          });
          // Trigger file tree refresh
          window.dispatchEvent(new CustomEvent('refresh-files'));
        }
      };
      input.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open folder',
        variant: 'destructive',
      });
    }
  };

  const handleOpenFile = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            if (e.target?.result) {
              await addFile(file.name);
              // Trigger file tree refresh
              window.dispatchEvent(new CustomEvent('refresh-files'));
              toast({
                title: 'Success',
                description: 'File opened successfully',
              });
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open file',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const handleSplitEditor = () => {
    setIsEditorSplit(!isEditorSplit);
    window.dispatchEvent(new CustomEvent('split-editor'));
  };

  const handleNewFile = async () => {
    try {
      const fileName = prompt('Enter file name:', 'untitled.ts');
      if (!fileName) return;

      await addFile(fileName);
      // Trigger file tree refresh
      window.dispatchEvent(new CustomEvent('refresh-files'));

      toast({
        title: 'Success',
        description: 'New file created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create file',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/auth');
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAs = async () => {
    if (!currentFile) {
      toast({
        title: 'Error',
        description: 'No file is currently open',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPath = prompt('Save as:', currentFile);
      if (!newPath) return;

      await saveFileAs(currentFile, newPath);
      toast({
        title: 'Success',
        description: 'File saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save file',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!currentFile) {
      toast({
        title: 'Error',
        description: 'No file is currently open',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveFile(currentFile);
      toast({
        title: 'Success',
        description: 'File saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save file',
        variant: 'destructive',
      });
    }
  };

  const saveFileAs = async (oldPath: string, newPath: string) => {
    try {
      await saveFile(newPath);
      window.dispatchEvent(new CustomEvent('refresh-files'));
    } catch (error) {
      throw new Error('Failed to save file');
    }
  };

  return (
    <Menubar className="border-b px-2 lg:px-4">
      <MenubarMenu>
        <MenubarTrigger className="font-bold">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={handleNewFile}>
            <FileIcon className="mr-2 h-4 w-4" />
            New File <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Open</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onClick={handleOpenFolder}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Folder...
              </MenubarItem>
              <MenubarItem onClick={handleOpenFile}>
                <FileText className="mr-2 h-4 w-4" />
                Open File...
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={handleSaveAs}>Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-bold">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={handleSplitEditor}>Split Editor</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleToggleSidebar}>
            Toggle Sidebar <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onToggleTerminal}>
            <Terminal className="mr-2 h-4 w-4" />
            Toggle Terminal <MenubarShortcut>⌘`</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}