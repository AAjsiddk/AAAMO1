"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft, X } from 'lucide-react'

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

type SidebarContext = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = ({
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(!isMobile)

  const toggleSidebar = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])
  
   const closeSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      isOpen,
      setIsOpen,
      isMobile,
      toggleSidebar,
    }),
    [isOpen, setIsOpen, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div 
        onClickCapture={(e) => {
          // Close sidebar on mobile when a link is clicked
          let target = e.target as HTMLElement;
          while (target && target.parentElement) {
            if (target instanceof HTMLAnchorElement && target.href) {
              closeSidebar();
              return;
            }
            target = target.parentElement;
          }
        }}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { isOpen, isMobile, setIsOpen } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-72 bg-background p-0 text-foreground border-l"
        >
          <SheetHeader className="sr-only">
             <SheetTitle>القائمة الرئيسية</SheetTitle>
             <SheetDescription>
                تنقل بين أقسام التطبيق المختلفة.
             </SheetDescription>
           </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      ref={ref}
      className={cn(
        "bg-background text-foreground flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-l",
        isOpen ? 'w-64' : 'w-20',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggleSidebar, isOpen, isMobile } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", isMobile ? '' : 'hidden md:inline-flex', className)}
      onClick={toggleSidebar}
      {...props}
    >
      {isMobile ? <PanelLeft /> : isOpen ? <X /> : <PanelLeft/>}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center p-4 border-b h-14",
        !isOpen && "h-14",
        className
        )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden p-2", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-2 mt-auto border-t", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean; }
>(({ asChild = false, isActive = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm text-foreground/80 outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      className={cn("my-2 bg-border/50", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
}
