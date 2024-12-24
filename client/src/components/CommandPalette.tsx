import * as React from "react";
import { Command } from "cmdk";
import {
  FileText,
  Settings,
  GitBranch,
  Terminal,
  Search,
  Code2,
  PanelLeft,
  Save,
  FolderOpen,
} from "lucide-react";
import { useFile } from "@/lib/file-context";
import { useTheme } from "@/lib/theme-context";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { addFile, saveFile } = useFile();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    command();
    setOpen(false);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[640px] w-full 
        bg-popover border border-border rounded-lg shadow-lg p-2 z-50"
    >
      <div className="flex items-center border-b border-border px-3 pb-3">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <Command.Input
          autoFocus
          placeholder="Type a command or search..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <Command.List className="mt-2 px-1">
        <Command.Empty className="py-2 px-3 text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        <Command.Group heading="General">
          <Command.Item
            onSelect={() => runCommand(() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  addFile(file.name);
                }
              };
              input.click();
            })}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-foreground aria-selected:bg-accent cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Open File
          </Command.Item>

          <Command.Item
            onSelect={() => runCommand(() => saveFile(''))}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-foreground aria-selected:bg-accent cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save File
          </Command.Item>
        </Command.Group>

        <Command.Group heading="View">
          <Command.Item
            onSelect={() => runCommand(() => setTheme('dark'))}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-foreground aria-selected:bg-accent cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Toggle Dark Mode
          </Command.Item>

          <Command.Item
            onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('toggle-sidebar')))}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-foreground aria-selected:bg-accent cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
            Toggle Sidebar
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Coming Soon">
          <Command.Item
            onSelect={() => {}}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-muted-foreground aria-selected:bg-accent cursor-default"
          >
            <GitBranch className="w-4 h-4" />
            Git Commands (Coming Soon)
          </Command.Item>

          <Command.Item
            onSelect={() => {}}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-muted-foreground aria-selected:bg-accent cursor-default"
          >
            <Terminal className="w-4 h-4" />
            Terminal Commands (Coming Soon)
          </Command.Item>

          <Command.Item
            onSelect={() => {}}
            className="py-2 px-3 rounded-md text-sm flex items-center gap-2 text-muted-foreground aria-selected:bg-accent cursor-default"
          >
            <Code2 className="w-4 h-4" />
            AI Suggestions (Coming Soon)
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
