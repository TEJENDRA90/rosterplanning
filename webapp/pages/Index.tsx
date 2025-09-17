
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Upload, Plus, Trash2, FileDown, RefreshCw, Search, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RosterDialog } from "@/components/RosterDialog";
import { get, post, del } from "@/lib/service";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const navigate = useNavigate();
  // UI and state management
  const [searchTerm, setSearchTerm] = useState("");
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const [selectedRosters, setSelectedRosters] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [rosters, setRosters] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRoster, setPendingRoster] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Set progress bar to 100% when upload dialog opens, reset on close
  useEffect(() => {
    if (uploadDialogOpen && uploadFile) {
      setUploadProgress(100);
    } else if (!uploadDialogOpen) {
      setUploadProgress(0);
    }


  }, [uploadDialogOpen, uploadFile]);


  // Fetch roster data from API and set state
  const fetchRosters = async () => {
    setRosters([]);
    try {
      const response = await get("./api/roster/rosterManagement/fetchRoster");
      if (response.data.status === 200) {
        setRosters(response.data.results.map((item: any) => ({
          ...item,
          id: String(item.ROSTER_HEADER_ID), // Ensure unique id for selection
        })));
      } else {
        setAlert({ type: 'error', message: 'Data load failed' });
      }
    } catch (error) {
      setRosters([]);
      setAlert({ type: 'error', message: 'Data load failed' });
    }
  };

  // Fetch current user info from API
  const fetchCurrentUser = async () => {
    try {
      const response = await get("./api/currentUser");
      setCurrentUser(response.data);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRosters(); // Uncommented to fetch data on mount
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Navigate to roster detail page
  const handleRosterClick = (roster: any) => {
    navigate(`/roster/${roster.ROSTER_HEADER_ID}`, { state: { roster } });
  };

  // Select/deselect a single roster row
  const handleSelectRoster = (rosterId: string) => {
    setSelectedRosters(prev => 
      prev.includes(rosterId) 
        ? prev.filter(id => id !== rosterId)
        : [...prev, rosterId]
    );
  };

  // Select/deselect all roster rows
  const handleSelectAll = () => {
    if (selectedRosters.length === rosters.length) {
      setSelectedRosters([]);
    } else {
      setSelectedRosters(rosters.map(r => r.id));
    }
  };

  // Export filtered roster data to XLSX file
  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredRosters.map(roster => ({
        "Roster Name": roster.ROSTER_NAME,
        "Roster Code": roster.ROSTER_CODE,
        "Rostering Days": roster.DAY,
        "Roster Modified By": roster.MODIFIED_BY,
        "Roster Modified On": roster.FORMAT_MODIFIED_ON,
        "Roster Status": roster.STATUS
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rosters");
    XLSX.writeFile(wb, "rosters.xlsx");
  };

  // Open file input for xlsx upload
  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  // Parse selected xlsx file and open upload dialog
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setUploadData(json);
      setUploadDialogOpen(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // Filter rosters by search term
  const filteredRosters = rosters.filter(roster =>
    roster.ROSTER_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.ROSTER_CODE.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background" style={{ padding: '5px' }}>
        <div className="py-4">

          <>
          {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">Rosters</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-[#347deb] text-white hover:bg-blue-500 force-text-white-on-hover"
                  onClick={fetchRosters}
                >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                  variant="default"
                size="sm"
                onClick={toggleDarkMode}
                  className="bg-[#347deb] text-white hover:bg-blue-500"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
                <Button variant="default" size="sm" className="bg-[#347deb] text-white hover:bg-blue-500" asChild>
                  <a href="./RosterSample.xlsx" download>
                <Download className="h-4 w-4" /> 
                Templete
                  </a>
              </Button>
                <Button variant="default" size="sm" className="bg-[#347deb] text-white hover:bg-blue-500" onClick={handleUploadClick}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsRosterDialogOpen(true)}
                  className="bg-[#347deb] text-white hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                Add Roster
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedRosters.length === 0}
                  className="bg-[#347deb] text-white hover:bg-blue-500"
              >
                <Trash2 className="h-4 w-4" />
                Delete Roster
              </Button>
              <Button 
                  variant="default"
                size="sm" 
                  onClick={() => setExportDialogOpen(true)}
                  className="bg-[#347deb] text-white hover:bg-blue-500"
              >
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
            <div className="border rounded-lg overflow-auto max-h-[800px]">
              <Table className="min-w-[700px]">
                <TableHeader className="sticky top-0 z-10 bg-[#347deb]">
                  <TableRow className="bg-[#347deb] hover:bg-[#347deb]">
                    <TableHead className="w-12 text-white sticky top-0 z-20 bg-[#347deb]">{/* Checkbox */}
                      <Checkbox checked={selectedRosters.length === rosters.length && rosters.length > 0} onCheckedChange={handleSelectAll} />
                  </TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Roster Name</TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Roster Code</TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Rostering Days</TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Modified By</TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Modified On</TableHead>
                    <TableHead className="text-white sticky top-0 z-20 bg-[#347deb] text-xs md:text-sm">Roster Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredRosters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400">
                        No data loaded. Click Refresh to load rosters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRosters.map((roster) => (
                  <TableRow key={roster.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedRosters.includes(roster.id)}
                        onCheckedChange={() => handleSelectRoster(roster.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleRosterClick(roster)}
                        className="text-blue-600 hover:underline text-left"
                      >
                            {roster.ROSTER_NAME}
                      </button>
                    </TableCell>
                        <TableCell>{roster.ROSTER_CODE}</TableCell>
                        <TableCell>{roster.DAY}</TableCell>
                        <TableCell>{roster.MODIFIED_BY}</TableCell>
                        <TableCell>{roster.FORMAT_MODIFIED_ON}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-800">
                            {roster.STATUS}
                      </span>
                    </TableCell>
                  </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>

          <RosterDialog
            open={isRosterDialogOpen}
            onOpenChange={setIsRosterDialogOpen}
              onSubmit={(formData) => {
                setPendingRoster(formData);
                setConfirmDialogOpen(true);
              }}
            />

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Create Roster</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to create this roster?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#347deb] text-white hover:bg-blue-500"
                    onClick={async () => {
                      setConfirmDialogOpen(false);
                      if (!pendingRoster || !currentUser?.fullName) return;
                      const oPayload = {
                        ROSTER_NAME: pendingRoster.rosterName,
                        ROSTER_CODE: pendingRoster.rosterCode,
                        DAY: pendingRoster.rosteringDays,
                        MODIFIED_BY: currentUser.pUserId,
                        STATUS: "DRAFT",
                      };
                      try {
                        const response = await post("./api/roster/rosterManagement/createRoster", oPayload);
                        if (response.data.status === 201) {
                          setAlert({ type: 'success', message: 'Roster created successfully' });
                          fetchRosters();
                          setIsRosterDialogOpen(false);
                        } else {
                          setAlert({ type: 'error', message: 'Failed to create roster' });
                        }
                      } catch {
                        setAlert({ type: 'error', message: 'Failed to create roster' });
                      }
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the selected roster?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#347deb] text-white hover:bg-blue-500"
                    onClick={async () => {
                      setDeleteDialogOpen(false);
                      if (!currentUser?.fullName) return;
                      const payload = rosters
                        .filter(r => selectedRosters.includes(r.id))
                        .map(r => ({
                          ROSTER_HEADER_ID: r.ROSTER_HEADER_ID,
                          MODIFIED_BY: currentUser.fullName,
                          ROSTER_NAME: r.ROSTER_NAME,
                        }));
                      try {
                        const response = await del("./api/roster/rosterManagement/deleteRoster", { data: payload });
                        console.log(response);
                        if (response.data.status === 202) {
                          setAlert({ type: 'success', message: 'Roster deleted successfully' });
                          fetchRosters();
                          setSelectedRosters([]);
                        } else {
                          setAlert({ type: 'error', message: 'Failed to delete roster' });
                        }
                      } catch {
                        setAlert({ type: 'error', message: 'Failed to delete roster' });
                      }
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Export Confirmation Dialog */}
            <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Export to Excel</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to export the current roster table to an Excel (.xlsx) file?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel className="bg-white text-black border border-gray-300 hover:bg-white-500" >Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setExportDialogOpen(false);
                      handleExportToExcel();
                    }}
                    className="bg-[#347deb] text-white hover:bg-blue-500"
                  >
                    Confirm
                  </AlertDialogAction>
                  
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Upload Confirmation Dialog */}
            <AlertDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mass Upload Roster</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to upload this file?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 flex items-center gap-4">
                  <Progress value={uploadProgress} max={100} className="flex-1" />
                  <span className="min-w-[40px] text-right">{uploadProgress}%</span>
                </div>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={uploadProgress > 0 && uploadProgress < 100} className="bg-white text-black border border-gray-300 hover:bg-white-500">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                  className="bg-[#347deb] text-white hover:bg-blue-500"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                    onClick={async () => {
                      setUploadProgress(1);
                      try {
                        const response = await post("./api/roster/rosterManagement/massUpload", uploadData, {
                          onUploadProgress: (progressEvent: any) => {
                            if (progressEvent.total) {
                              setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                            }
                          },
                        });
                        setUploadProgress(100);
                        setAlert({ type: 'success', message: 'Document uploaded successfully' });
                        fetchRosters();
                      } catch {
                        setAlert({ type: 'error', message: 'Mass upload failed' });
                      } finally {
                        setTimeout(() => {
                          setUploadDialogOpen(false);
                          setUploadProgress(0);
                          setUploadFile(null);
                          setUploadData([]);
                        }, 1000);
                      }
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                  
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Success/Error Alert */}
            {alert && (
              <div className="fixed top-4 right-4 z-50 w-full max-w-xs">
                <Alert
                  variant={alert.type === 'error' ? 'destructive' : undefined}
                  className={
                    alert.type === 'error'
                      ? 'bg-red-600 text-white border-none shadow-lg'
                      : 'bg-green-600 text-white border-none shadow-lg'
                  }
                >
                  <div className="font-semibold">
                    {alert.type === 'success' ? 'Success' : 'Error'}
                  </div>
                  <div>{alert.message}</div>
                </Alert>
              </div>
            )}
          </>
        </div>
      </div>
      <style>{`
  .force-text-white-on-hover:hover, .force-text-white-on-hover:focus {
    color: #fff !important;
  }
`}</style>
    </div>
  );
};

export default Index;
