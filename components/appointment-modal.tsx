import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "lucide-react"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Agent beta v2.1.3
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-8">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2"> Placing a call on behalf of you</h3>
          <p className="text-muted-foreground">Hang in there... Booking an appointment for you to the nearest clinic🩷🍀</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}


