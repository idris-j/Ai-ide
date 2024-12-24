import { EnhancedSidebarContent } from "@/components/ui/sidebar"

interface SidebarProps {
  onFileSelect: (file: string | null) => void;
}

export function Sidebar({ onFileSelect }: SidebarProps) {
  return <EnhancedSidebarContent onFileSelect={onFileSelect} />;
}