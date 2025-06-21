// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast
"use client"

import * as React from "react"
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"
import { useToast as useToastHook } from "@/hooks/use-toast"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  toastPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

type ToastOptions = Omit<ToasterToast, "id">

const useToast = useToastHook

const toast = (options: ToastOptions) => {
  const { toast } = useToast()
  return toast(options)
}

export { useToast, toast, type ToastOptions, type ToasterToast }