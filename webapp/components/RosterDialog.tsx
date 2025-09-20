
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface RosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roster: { rosterName: string; rosterCode: string; rosteringDays: number }) => void;
}

export function RosterDialog({ open, onOpenChange, onSubmit }: RosterDialogProps) {
  const [formData, setFormData] = useState({
    rosterName: "",
    rosterCode: "",
    rosteringDays: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rosterName && formData.rosterCode && formData.rosteringDays) {
      const rosterData = {
        ...formData,
        rosteringDays: typeof formData.rosteringDays === 'string' ? parseInt(formData.rosteringDays) : formData.rosteringDays
      };
      onSubmit(rosterData);
      setFormData({ rosterName: "", rosterCode: "", rosteringDays: "" });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({ rosterName: "", rosterCode: "", rosteringDays: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Roster</DialogTitle>
        </DialogHeader>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please Note : Roster Code must be unique, duplication is not allowed.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rosterName">
              Roster Name: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rosterName"
              placeholder="Please provide roster name"
              value={formData.rosterName}
              onChange={(e) => setFormData({ ...formData, rosterName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rosterCode">
              Roster Code: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rosterCode"
              placeholder="Please provide unique roster code"
              value={formData.rosterCode}
              onChange={(e) => setFormData({ ...formData, rosterCode: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rosteringDays">
              Number of days for Roster: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rosteringDays"
              type="text"
              placeholder="Enter number of days"
              value={formData.rosteringDays}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string or numbers only
                if (value === '' || /^\d+$/.test(value)) {
                  setFormData({ ...formData, rosteringDays: value === '' ? '' : parseInt(value) });
                }
              }}
              onBlur={(e) => {
                // Set to 1 if empty when user leaves the field
                if (e.target.value === '') {
                  setFormData({ ...formData, rosteringDays: 1 });
                }
              }}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="default" onClick={handleCancel} className="bg-white text-black border border-gray-300 hover:bg-white-500">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#347deb] text-white hover:bg-blue-500">
              Create
            </Button>
            
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
