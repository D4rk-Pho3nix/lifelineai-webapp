import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone } from "lucide-react"

interface CallerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CallerModal({ isOpen, onClose }: CallerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Conversational Agent beta v2.1.3         </DialogTitle>
        </DialogHeader>
        <div className="text-center py-8">
          <Phone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2"> Calling you right now...</h3>
          <p className="text-muted-foreground">Just remember im here to listen to you 🩷 No pressure, No Judgement, Full privacy 🍀</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
