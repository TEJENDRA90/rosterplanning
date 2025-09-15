
import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { get, post } from "@/lib/service";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ROSTER_HEADER_ID: number;
  currentUser: any;
  fetchRosterDaysStructure: () => void;
}

export function AddJobDialog({ open, onOpenChange, ROSTER_HEADER_ID, currentUser, fetchRosterDaysStructure }: AddJobDialogProps) {
  const [selectedJob, setSelectedJob] = useState("");
  const [jobOptions, setJobOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      get("./../../api/roster/rosterManagement/fetchPositions")
        .then(res => {
          if (res.data && Array.isArray(res.data.results)) {
            setJobOptions(res.data.results);
          } else {
            setJobOptions([]);
            setError("No positions found");
          }
        })
        .catch(() => {
          setJobOptions([]);
          setError("Failed to load positions");
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      const jobData = jobOptions.find(job => String(job.JOB_CODE_ID) === selectedJob);
      if (jobData) {
        const oPayload = {
          ROSTER_HEADER_ID,
          JOB_TITLE: jobData.JOB_TITLE_DESC,
          JOB_CODE: jobData.JOB_CODE_ID,
          MODIFIED_BY: currentUser.fullName,
        };
        setLoading(true);
        setError(null);
        try {
          const res = await post("./../../api/roster/rosterManagement/addDefaultRoster", oPayload);
          if (res.data && res.data.status === 201) {
            fetchRosterDaysStructure();
            setSelectedJob("");
            onOpenChange(false);
          } else {
            setError("Failed to add job");
          }
        } catch {
          setError("Failed to add job");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleCancel = () => {
    setSelectedJob("");
    onOpenChange(false);
  };

  const uniqueJobOptions = useMemo(() => {
    const seen = new Set();
    return jobOptions.filter(job => {
      if (!job.JOB_CODE_ID || seen.has(job.JOB_CODE_ID)) return false;
      seen.add(job.JOB_CODE_ID);
      return true;
    });
  }, [jobOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobSelect">
              Select Job: <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedJob || undefined} onValueChange={setSelectedJob} disabled={loading || !!error}>
              <SelectTrigger id="jobSelect">
                <SelectValue placeholder={loading ? "Loading..." : error ? error : "Select a job"} />
              </SelectTrigger>
              <SelectContent>
                {uniqueJobOptions.map((job) => (
                  <SelectItem key={job.JOB_CODE_ID} value={String(job.JOB_CODE_ID)}>
                    {job.JOB_TITLE_DESC} ({job.JOB_CODE_ID})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="default" onClick={handleCancel} className="bg-white text-black border border-gray-300 hover:bg-white-500">
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedJob || loading || !!error} className="bg-[#347deb] text-white hover:bg-blue-500">
              Proceed
            </Button>
            
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
