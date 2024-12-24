import { cn } from "@/lib/utils"

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn(
      "w-full py-2 px-4 border-t bg-background text-muted-foreground text-sm text-center",
      className
    )}>
      Made by: Idris Jimoh
    </footer>
  )
}
