// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast

import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"
import {
  useToast as useToastOriginal,
  type ToastOptions as ToastOptionsOriginal,
} from "@/components/ui/toaster"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  toastPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

type ToastOptions = Omit<ToasterToast, "id">

const useToast = () => {
  const { toast, dismiss, toasts } = useToastOriginal()

  function addToast(options: ToastOptions) {
    return toast(options)
  }

  return {
    toast: addToast,
    dismiss,
    toasts,
  }
}

export { useToast, type ToastOptions, type ToasterToast }