"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Trash2 } from "lucide-react"

interface ConfirmDialogProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isOpen: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const buttonColors = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-orange-600 hover:bg-orange-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
  }

  const iconColor = {
    danger: "text-red-500",
    warning: "text-orange-500",
    info: "text-blue-500",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 ${iconColor[variant]}`} />
            <DialogTitle className="text-white text-xl">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-slate-300 text-base">{description}</DialogDescription>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={onCancel}
            disabled={loading || isLoading}
            className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || isLoading}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${buttonColors[variant]}`}
          >
            {variant === "danger" && <Trash2 size={18} />}
            {loading || isLoading ? "Processing..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
