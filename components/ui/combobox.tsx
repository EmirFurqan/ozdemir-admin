"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command } from "cmdk"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Simple Command Components wrapping cmdk
const CommandInput = React.forwardRef<
    React.ElementRef<typeof Command.Input>,
    React.ComponentPropsWithoutRef<typeof Command.Input>
>(({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Command.Input
            ref={ref}
            className={cn(
                "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    </div>
))
CommandInput.displayName = Command.Input.displayName

const CommandList = React.forwardRef<
    React.ElementRef<typeof Command.List>,
    React.ComponentPropsWithoutRef<typeof Command.List>
>(({ className, ...props }, ref) => (
    <Command.List
        ref={ref}
        className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
        {...props}
    />
))
CommandList.displayName = Command.List.displayName

const CommandEmpty = React.forwardRef<
    React.ElementRef<typeof Command.Empty>,
    React.ComponentPropsWithoutRef<typeof Command.Empty>
>((props, ref) => (
    <Command.Empty
        ref={ref}
        className="py-6 text-center text-sm"
        {...props}
    />
))
CommandEmpty.displayName = Command.Empty.displayName

const CommandGroup = React.forwardRef<
    React.ElementRef<typeof Command.Group>,
    React.ComponentPropsWithoutRef<typeof Command.Group>
>(({ className, ...props }, ref) => (
    <Command.Group
        ref={ref}
        className={cn(
            "overflow-hidden p-1 text-slate-800 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500",
            className
        )}
        {...props}
    />
))
CommandGroup.displayName = Command.Group.displayName

const CommandItem = React.forwardRef<
    React.ElementRef<typeof Command.Item>,
    React.ComponentPropsWithoutRef<typeof Command.Item>
>(({ className, ...props }, ref) => (
    <Command.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 data-[disabled]:opacity-50",
            className
        )}
        {...props}
    />
))
CommandItem.displayName = Command.Item.displayName


export interface ComboboxProps {
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Seçiniz...",
    searchPlaceholder = "Ara...",
    emptyText = "Sonuç bulunamadı."
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const selectedLabel = React.useMemo(() => {
        return options.find((framework) => framework.value === value)?.label
    }, [value, options])

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal bg-slate-50 border-slate-200 text-slate-900",
                        !value && "text-slate-500"
                    )}
                >
                    {value ? selectedLabel : <span className="text-slate-500">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                </Button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Content className="w-[--radix-popover-trigger-width] p-0 bg-white border border-slate-200 shadow-md rounded-md z-50">
                <Command className="w-full">
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value} // Use ID as stable value
                                    keywords={[option.label]} // Search by label
                                    onSelect={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Root>
    )
}
