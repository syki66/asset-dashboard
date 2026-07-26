"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const useResponsiveCollisionPadding = () => {
  const [collisionPadding, setCollisionPadding] = React.useState(0)

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return

    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)")
    const updateCollisionPadding = () =>
      setCollisionPadding(desktopMediaQuery.matches ? 0 : 8)

    updateCollisionPadding()
    desktopMediaQuery.addEventListener("change", updateCollisionPadding)

    return () => {
      desktopMediaQuery.removeEventListener("change", updateCollisionPadding)
    }
  }, [])

  return collisionPadding
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, collisionPadding, ...props }, ref) => {
  const responsiveCollisionPadding = useResponsiveCollisionPadding()

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding ?? responsiveCollisionPadding}
        className={cn(
          "glass-card z-50 max-h-[var(--radix-popover-content-available-height)] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-md p-4 text-popover-foreground outline-hidden lg:max-h-none lg:max-w-none lg:overflow-y-visible lg:overscroll-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
