
import React, { useEffect, useState, useMemo, useCallback, useRef, startTransition } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, FileDown, ArrowLeft, Save } from "lucide-react";
import { AddJobDialog } from "@/components/AddJobDialog";
import { get, post, del, put } from "@/lib/service";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RosterRow {
  UNIQUE_CODE_JOB_TITLE: string;
  JOB_TITLE: string;
  JOB_CODE: string;
  ROSTER_HEADER_ID: number;
  ROSTER_ITEM_ID: number;
  JOB_TITLE_SEQ_NO: string;
  DAY: number;
  [key: string]: any;
}

interface SchedulingStatusItem {
  SHIFT_CODE: string;
  ACTUAL_SLOTS: string;
  TOTAL_HOURS: string;
  [key: string]: any;
}

const RosterDetail = () => {
  const { rosterCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const roster = location.state?.roster;

  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [rowWidth, setRowWidth] = useState([250]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [planning, setPlanning] = useState<any>(null);
  const [schedulingStatus, setSchedulingStatus] = useState<SchedulingStatusItem[] | null>(null);
  const [rosterDaysStructure, setRosterDaysStructure] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rosterDaysLoading, setRosterDaysLoading] = useState(false);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editedRowValues, setEditedRowValues] = useState<Record<string, any>>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rosterStatus, setRosterStatus] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await get("./../../api/currentUser");
      setCurrentUser(res.data);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const fetchPlanning = useCallback(async () => {
    try {
      const res = await get("./../../api/roster/rosterManagement/fetchPlanning");
      setPlanning(res.data.results);
    } catch {
      setPlanning(null);
    }
  }, []);

  const fetchSchedulingStatus = useCallback(async () => {
    setRosterDaysLoading(true);
    try {
      const res = await get("./../../api/roster/rosterManagement/fetchSchedulingJobBase");
      setSchedulingStatus(res.data.results);
    } catch {
      setSchedulingStatus(null);
    } finally {
      setRosterDaysLoading(false);
    }
  }, []);

  const fetchRosterDaysStructure = useCallback(async (headerId: string | number) => {
    setRosterDaysLoading(true);
    try {
      const res = await get(`./../../api/roster/rosterManagement/fetchRosterDaysStructure?ROSTER_HEADER_ID=${headerId}`);
      if (res.data?.status === 200 && Array.isArray(res.data.rows)) {
        setRosterStatus(!!res.data.rosterStatus);
        const maxDays = res.data.rows.reduce((max, row) => Math.max(max, row.DAY || 0), 0);
        const normalizedRows = res.data.rows.map((row: any) => {
          const newRow = { ...row };
          for (let day = 1; day <= maxDays; day++) {
            newRow[`SLOTS_${day}`] = newRow[`SLOTS_${day}`] || '';
            newRow[`TOTAL_HOURS_${day}`] = newRow[`TOTAL_HOURS_${day}`] || '';
            newRow[`DAY_TYPE_${day}`] = newRow[`DAY_TYPE_${day}`] || '';
            newRow[`SCHEDULE_STATUS_${day}`] = newRow[`SCHEDULE_STATUS_${day}`] || '';
          }
          return newRow;
        });
        setRosterDaysStructure(normalizedRows);
      } else {
        setRosterDaysStructure([]);
        setAlert({ type: 'error', message: 'Data load failed' });
      }
    } catch {
      setRosterDaysStructure([]);
      setAlert({ type: 'error', message: 'Data load failed' });
    } finally {
      setRosterDaysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchPlanning();
    fetchSchedulingStatus();
    const headerId = roster?.ROSTER_HEADER_ID;
    if (headerId) {
      fetchRosterDaysStructure(headerId);
    }
  }, [roster, fetchCurrentUser, fetchPlanning, fetchSchedulingStatus, fetchRosterDaysStructure]);

  const generateDayColumns = useCallback(() => {
    if (!rosterDaysStructure || rosterDaysStructure.length === 0) return [];
    const maxDays = Math.max(...rosterDaysStructure.map(row => row.DAY));
    const columns = [];
    for (let day = 1; day <= maxDays; day++) {
      columns.push(day);
    }
    return columns;
  }, [rosterDaysStructure]);

  const rosterName = roster?.ROSTER_NAME || roster?.rosterName || rosterCode || "Roster";
  const dayColumns = useMemo(() => generateDayColumns(), [generateDayColumns]);
  
  // Calculate dynamic width based on number of days
  const dynamicDayWidth = useMemo(() => {
    const numDays = dayColumns.length;
    if (numDays <= 3) return 300; // Wide columns for few days
    if (numDays <= 5) return 250; // Medium columns for moderate days
    if (numDays <= 7) return 200; // Narrow columns for many days
    return 180; // Very narrow for many days
  }, [dayColumns.length]);
  
  // Use dynamic width or slider value
  const effectiveDayWidth = rowWidth[0] || dynamicDayWidth;


  const memoizedPlanning = useMemo(() => Array.isArray(planning) ? planning : [], [planning]);
  const memoizedSchedulingStatus = useMemo(() => Array.isArray(schedulingStatus) ? schedulingStatus : [], [schedulingStatus]);

  const dayTypeOptions = useMemo(
    () => memoizedPlanning.map(item => ({
      value: String(item.CODE),
      label: `${item.CODE} - ${item.LOOKUP_NAME}`,
    })),
    [memoizedPlanning]
  );

  const getScheduleOptions = useCallback((jobTitle: string) => {
    if (!memoizedSchedulingStatus || !Array.isArray(memoizedSchedulingStatus)) {
      return [];
    }
    
    // Find the job that matches the jobTitle
    const jobData = memoizedSchedulingStatus.find((item: any) => {
      return item.jobCodeId === jobTitle;
    });
    
    if (!jobData || !jobData.slots || !Array.isArray(jobData.slots)) {
      return [];
    }
    
    // Map the slots to schedule options
    return jobData.slots.map((slot: any) => ({
      value: String(slot.SHIFT_CODE),
      label: `${slot.SHIFT_CODE} - ${slot.ACTUAL_SLOTS}`,
      slots: slot.ACTUAL_SLOTS,
      totalHours: slot.TOTAL_HOURS,
    }));
  }, [memoizedSchedulingStatus]);

  const handleAddJob = useCallback((jobData: { jobTitle: string; jobCode: string }, closeDialog: () => void) => {
    closeDialog();
    setRosterDaysLoading(true);
    setTimeout(() => {
      const newId = Date.now();
      const maxDays = rosterDaysStructure.reduce((max, row) => Math.max(max, row.DAY || 0), 0) || 1;
      const maxSeqNo = (rosterDaysStructure.filter(r => r.JOB_TITLE === jobData.jobTitle).length + 1).toString();
      const newRow: any = {
        ROSTER_HEADER_ID: roster?.ROSTER_HEADER_ID || '',
        ROSTER_ITEM_ID: newId,
        JOB_TITLE: jobData.jobTitle,
        JOB_CODE: jobData.jobCode,
        UNIQUE_CODE_JOB_TITLE: `${jobData.jobTitle}${maxSeqNo}`,
        JOB_TITLE_SEQ_NO: maxSeqNo,
        DAY: maxDays,
      };
      for (let day = 1; day <= maxDays; day++) {
        newRow[`DAY_TYPE_${day}`] = "";
        newRow[`SCHEDULE_STATUS_${day}`] = "";
        newRow[`SLOTS_${day}`] = "";
        newRow[`TOTAL_HOURS_${day}`] = "";
      }
      setRosterDaysStructure(prev => [newRow, ...prev]);
      setEditRowId(String(newId));
      setEditedRowValues({});
      setRosterDaysLoading(false);
    }, 400);
  }, [rosterDaysStructure, roster]);

  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedJobs.length === rosterDaysStructure.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(rosterDaysStructure.map(row => row.ROSTER_ITEM_ID.toString()));
    }
  }, [selectedJobs.length, rosterDaysStructure]);

  const handleDeleteSelected = useCallback(async () => {
    if (!currentUser || selectedJobs.length === 0) return;
    const payload = selectedJobs.map((id) => {
      const row = rosterDaysStructure.find((r) => String(r.ROSTER_ITEM_ID) === id);
      return row
        ? {
            ROSTER_HEADER_ID: row.ROSTER_HEADER_ID,
            ROSTER_ITEM_ID: row.ROSTER_ITEM_ID,
            MODIFIED_BY: currentUser.fullName,
          }
        : null;
    }).filter(Boolean);
    try {
      const response = await del("./../../api/roster/rosterManagement/deletePosition", { data: payload });
      if (response.data.status === 202) {
        setAlert({ type: "success", message: "Delete Successfully" });
        if (roster?.ROSTER_HEADER_ID) {
          fetchRosterDaysStructure(roster.ROSTER_HEADER_ID);
        }
        setSelectedJobs([]);
      } else {
        setAlert({ type: "error", message: "Delete failed" });
      }
    } catch {
      setAlert({ type: "error", message: "Delete failed" });
    }
  }, [currentUser, selectedJobs, rosterDaysStructure, roster, fetchRosterDaysStructure]);

  const handleDayTypeChange = useCallback((rowId: string, day: number, value: string) => {
    setEditedRowValues(prev => {
      const prevRow = prev[rowId] || {};
      const prevDay = prevRow[day] || {};
      return {
        ...prev,
        [rowId]: {
          ...prevRow,
          [day]: {
            ...prevDay,
            DAY_TYPE: value,
          },
        },
      };
    });
  }, []);

  const handleScheduleChange = useCallback((rowId: string, day: number, value: string, jobTitle: string) => {
    const scheduleOptions = getScheduleOptions(jobTitle);
    const scheduleObj = scheduleOptions.find(s => s.value === value);
    setEditedRowValues(prev => {
      const prevRow = prev[rowId] || {};
      const prevDay = prevRow[day] || {};
      return {
        ...prev,
        [rowId]: {
          ...prevRow,
          [day]: {
            ...prevDay,
            SCHEDULE_STATUS: value,
            SLOTS: scheduleObj?.slots || '',
            TOTAL_HOURS: scheduleObj?.totalHours || '',
          },
        },
      };
    });
  }, [getScheduleOptions]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Function to break slots into two lines
  const breakSlotsIntoTwoLines = (slots: string) => {
    if (!slots) return { line1: '', line2: '' };
    
    const parts = slots.split(' | ');
    if (parts.length <= 2) {
      return { line1: slots, line2: '' };
    }
    
    const midPoint = Math.ceil(parts.length / 2);
    const line1 = parts.slice(0, midPoint).join(' | ');
    const line2 = parts.slice(midPoint).join(' | ');
    
    return { line1, line2 };
  };

  const TableCellComponent = React.memo(
    ({
      isEditing,
      dayTypeValue,
      scheduleValue,
      slotsValue,
      totalHoursValue,
      dayTypeOptions,
      jobTitle,
      onDayTypeChange,
      onScheduleChange,
      rowId,
      day,
      effectiveDayWidth
    }: {
      isEditing: boolean;
      dayTypeValue: string;
      scheduleValue: string;
      slotsValue: string;
      totalHoursValue: string;
      dayTypeOptions: { value: string; label: string }[];
      jobTitle: string;
      onDayTypeChange: (val: string) => void;
      onScheduleChange: (val: string) => void;
      rowId: string;
      day: number;
      effectiveDayWidth: number;
    }) => {
      const scheduleOptions = React.useMemo(() => getScheduleOptions(jobTitle), [getScheduleOptions, jobTitle]);
      const [localDayType, setLocalDayType] = React.useState(dayTypeValue);
      const [localSchedule, setLocalSchedule] = React.useState(scheduleValue);
      const [localSlots, setLocalSlots] = React.useState(slotsValue);
      const [localTotalHours, setLocalTotalHours] = React.useState(totalHoursValue);

      React.useEffect(() => { setLocalDayType(dayTypeValue); }, [dayTypeValue]);
      React.useEffect(() => { setLocalSchedule(scheduleValue); }, [scheduleValue]);
      React.useEffect(() => { setLocalSlots(slotsValue); }, [slotsValue]);
      React.useEffect(() => { setLocalTotalHours(totalHoursValue); }, [totalHoursValue]);

      React.useEffect(() => {
        const scheduleObj = scheduleOptions.find(s => s.value === localSchedule);
        setLocalSlots(scheduleObj?.slots || '');
        setLocalTotalHours(scheduleObj?.totalHours || '');
      }, [localSchedule, scheduleOptions]);

      return (
        <TableCell className="text-left p-0" style={{ width: `${effectiveDayWidth}px`, minWidth: `${effectiveDayWidth}px` }}>
          {isEditing ? (
            <div className="space-y-1 p-1.5">
              <Select
                value={localDayType || undefined}
                onValueChange={val => {
                  setLocalDayType(val);
                  onDayTypeChange(val);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs text-center">
                  <SelectValue placeholder="Select Day Type" />
                </SelectTrigger>
                <SelectContent>
                  {dayTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                key={`schedule-${jobTitle}-${localSchedule}`}
                value={localSchedule || undefined}
                onValueChange={val => {
                  const scheduleObj = scheduleOptions.find(s => s.value === val);
                  setLocalSchedule(val);
                  setLocalSlots(scheduleObj?.slots || '');
                  setLocalTotalHours(scheduleObj?.totalHours || '');
                  onScheduleChange(val);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs text-center">
                  <SelectValue placeholder="Select Schedule" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs leading-tight text-center">
                {(() => {
                  const { line1, line2 } = breakSlotsIntoTwoLines(localSlots);
                  if (!line1 && !line2) {
                    return <div className="text-gray-400">-</div>;
                  }
                  return (
                    <div className="bg-blue-100/80 backdrop-blur-sm rounded-md p-1.5 border border-blue-200/50">
                      <div className="text-black font-medium">{line1}</div>
                      {line2 && <div className="text-black font-medium">{line2}</div>}
                    </div>
                  );
                })()}
              </div>
              <div className="text-xs text-center font-medium">{localTotalHours}</div>
            </div>
          ) : (
            <div className="space-y-1 p-1.5">
              <div className="text-xs font-medium text-center">{dayTypeValue}</div>
              <div className="text-xs font-medium text-center">{scheduleValue}</div>
              <div className="text-xs leading-tight text-center">
                {(() => {
                  const { line1, line2 } = breakSlotsIntoTwoLines(slotsValue);
                  if (!line1 && !line2) {
                    return <div className="text-gray-400">-</div>;
                  }
                  return (
                    <div className="bg-blue-100/80 backdrop-blur-sm rounded-md p-1.5 border border-blue-200/50">
                      <div className="text-black font-medium">{line1}</div>
                      {line2 && <div className="text-black font-medium">{line2}</div>}
                    </div>
                  );
                })()}
              </div>
              <div className="text-xs text-center font-medium">{totalHoursValue}</div>
            </div>
          )}
        </TableCell>
      );
    }
  );

  const handleStartEdit = useCallback(() => {
    setRosterDaysLoading(true);
  }, []);

  const TableRowComponent = ({ row, onStartEdit }: { row: any, onStartEdit: () => void }) => {
    const isEditing = editRowId === row.ROSTER_ITEM_ID.toString();
    const [localEdits, setLocalEdits] = React.useState<{ [day: number]: any }>({});

    const handleSave = () => {
      setRosterDaysLoading(true);
      console.log('localEdits before update:', localEdits);
      console.log('Row being updated:', row);
      setRosterDaysStructure((prev: any[]) => {
        let found = false;
        const updatedRows = prev.map((r) => {
          if (r.ROSTER_ITEM_ID === row.ROSTER_ITEM_ID) {
            found = true;
            const updated = { ...r };
            for (let day = 1; day <= row.DAY; day++) {
              const edit = localEdits[day];
              updated[`DAY_TYPE_${day}`] = edit && edit.DAY_TYPE !== undefined ? edit.DAY_TYPE : r[`DAY_TYPE_${day}`] || "";
              updated[`SCHEDULE_STATUS_${day}`] = edit && edit.SCHEDULE_STATUS !== undefined ? edit.SCHEDULE_STATUS : r[`SCHEDULE_STATUS_${day}`] || "";
              updated[`SLOTS_${day}`] = edit && edit.SLOTS !== undefined ? edit.SLOTS : r[`SLOTS_${day}`] || "";
              updated[`TOTAL_HOURS_${day}`] = edit && edit.TOTAL_HOURS !== undefined ? edit.TOTAL_HOURS : r[`TOTAL_HOURS_${day}`] || "";
              updated[`ASLOTS_${day}`] = []; // Add ASLOTS for each day
            }
            console.log('Updated object:', updated);
            return { ...updated };
          }
          return r;
        });
        if (!found) {
          const newRow = { ...row };
          for (let day = 1; day <= row.DAY; day++) {
            const edit = localEdits[day];
            newRow[`DAY_TYPE_${day}`] = edit && edit.DAY_TYPE !== undefined ? edit.DAY_TYPE : "";
            newRow[`SCHEDULE_STATUS_${day}`] = edit && edit.SCHEDULE_STATUS !== undefined ? edit.SCHEDULE_STATUS : "";
            newRow[`SLOTS_${day}`] = edit && edit.SLOTS !== undefined ? edit.SLOTS : "";
            newRow[`TOTAL_HOURS_${day}`] = edit && edit.TOTAL_HOURS !== undefined ? edit.TOTAL_HOURS : "";
            newRow[`ASLOTS_${day}`] = []; // Add ASLOTS for each day
          }
          console.log('New row added:', newRow);
          return [newRow, ...updatedRows];
        }
        console.log('Updated array:', updatedRows);
        return [...updatedRows];
      });
      setEditRowId(null);
      setRosterDaysLoading(false);
    };

    const handleEdit = () => {
      setRosterDaysLoading(true);
      const initial: { [day: number]: any } = {};
      for (let i = 0; i < dayColumns.length; i++) {
        const day = dayColumns[i];
        initial[day] = {
          DAY_TYPE: row[`DAY_TYPE_${day}`] || "",
          SCHEDULE_STATUS: row[`SCHEDULE_STATUS_${day}`] || "",
          SLOTS: row[`SLOTS_${day}`] || "",
          TOTAL_HOURS: row[`TOTAL_HOURS_${day}`] || "",
        };
      }
      if (typeof startTransition === 'function') {
        startTransition(() => {
          setLocalEdits(initial);
          setEditRowId(row.ROSTER_ITEM_ID.toString());
          setRosterDaysLoading(false);
        });
      } else {
        setLocalEdits(initial);
        setEditRowId(row.ROSTER_ITEM_ID.toString());
        setRosterDaysLoading(false);
      }
    };

    const handleCellEdit = (day: number, field: string, value: string) => {
      setLocalEdits(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
          ...(field === 'SCHEDULE_STATUS' ? (() => {
            const scheduleOptions = getScheduleOptions(row.JOB_TITLE);
            const scheduleObj = scheduleOptions.find(s => s.value === value);
            return {
              SLOTS: scheduleObj?.slots || '',
              TOTAL_HOURS: scheduleObj?.totalHours || '',
            };
          })() : {}),
        },
      }));
    };

    return (
      <TableRow key={row.ROSTER_ITEM_ID} className="hover:bg-muted/50">
        <TableCell 
          className="w-12 text-center bg-white" 
          style={{ 
            position: 'sticky', 
            left: 0, 
            zIndex: 100,
            backgroundColor: 'white'
          }}
        >
          <Checkbox
            checked={selectedJobs.includes(row.ROSTER_ITEM_ID.toString())}
            onCheckedChange={() => handleSelectJob(row.ROSTER_ITEM_ID.toString())}
          />
        </TableCell>
        <TableCell 
          className="w-[120px] text-left bg-white" 
          style={{ 
            position: 'sticky', 
            left: '48px', 
            zIndex: 100,
            backgroundColor: 'white'
          }}
        >
          {row.JOB_TITLE}
        </TableCell>
        <TableCell 
          className="w-[100px] text-left bg-white" 
          style={{ 
            position: 'sticky', 
            left: '168px', 
            zIndex: 100,
            backgroundColor: 'white'
          }}
        >
          {row.JOB_CODE}
        </TableCell>
        <TableCell 
          className="w-[140px] text-left bg-white" 
          style={{ 
            position: 'sticky', 
            left: '268px', 
            zIndex: 100,
            backgroundColor: 'white'
          }}
        >
          {row.JOB_TITLE_SEQ_NO}
        </TableCell>
        {dayColumns.map(day => {
          const editVals = isEditing ? localEdits[day] || {} : (editedRowValues[row.ROSTER_ITEM_ID]?.[day]) || {};
          const currentDayType = isEditing ? editVals.DAY_TYPE ?? row[`DAY_TYPE_${day}`] : row[`DAY_TYPE_${day}`];
          const currentSchedule = isEditing ? editVals.SCHEDULE_STATUS ?? row[`SCHEDULE_STATUS_${day}`] : row[`SCHEDULE_STATUS_${day}`];
          const currentSlots = isEditing ? editVals.SLOTS ?? row[`SLOTS_${day}`] : row[`SLOTS_${day}`];
          const currentTotalHours = isEditing ? editVals.TOTAL_HOURS ?? row[`TOTAL_HOURS_${day}`] : row[`TOTAL_HOURS_${day}`];
          
          return (
            <TableCellComponent
              key={`${row.ROSTER_ITEM_ID}-${day}`}
              isEditing={isEditing}
              dayTypeValue={currentDayType}
              scheduleValue={currentSchedule}
              slotsValue={currentSlots}
              totalHoursValue={currentTotalHours}
              dayTypeOptions={dayTypeOptions}
              jobTitle={row.JOB_TITLE}
              onDayTypeChange={val => handleCellEdit(day, 'DAY_TYPE', val)}
              onScheduleChange={val => handleCellEdit(day, 'SCHEDULE_STATUS', val)}
              rowId={row.ROSTER_ITEM_ID.toString()}
              day={day}
              effectiveDayWidth={effectiveDayWidth}
            />
          );
        })}
        <TableCell className="w-[100px] text-center">
          {isEditing ? (
            <Button size="sm" className="bg-[#347deb] text-white hover:bg-blue-500" onClick={handleSave}>
              Save
            </Button>
          ) : (
            <Button size="sm" className="bg-[#347deb] text-white hover:bg-blue-500" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const MemoAddJobDialog = React.memo(AddJobDialog);

  const handleOpenAddJobDialog = useCallback(() => setIsAddJobDialogOpen(true), []);
  const handleCloseAddJobDialog = useCallback(() => setIsAddJobDialogOpen(false), []);

  const handleRosterStatusChange = async (sState: boolean) => {
    setRosterStatus(sState);
    let sStateValue = sState ? "ACTIVE" : "DRAFT";
    const rosterId = roster?.ROSTER_HEADER_ID || roster?.rosterHeaderId || roster?.id;
    const oPayload = {
      STATUS: sStateValue,
      ROSTER_HEADER_ID: rosterId,
      MODIFIED_BY: currentUser?.fullName || ""
    };
    try {
      const res = await put("./../../api/roster/rosterManagement/markRosterStatus", oPayload);
      if (res.data?.status === 202) {
        setAlert({ type: 'success', message: 'Roster Updated Successfully..!!' });
      } else {
        setRosterDaysStructure([]);
        setAlert({ type: 'error', message: 'Data loading failed..!!' });
      }
    } catch {
      setRosterDaysStructure([]);
      setAlert({ type: 'error', message: 'Data loading failed..!!' });
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ padding: '5px' }}>
      <div className="py-4">
      {(rosterDaysLoading) && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#347deb]"></div>
          <span className="ml-4 text-[#347deb] font-semibold">Loading...</span>
        </div>
      )}
      {alert && (
        <div className="fixed top-4 right-4 z-50 w-full max-w-xs">
          <div className={`p-4 rounded shadow-lg ${alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{alert.message}</div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="default" size="sm" onClick={() => navigate("/")} className="bg-[#347deb] text-white hover:bg-blue-500">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">{rosterName}</h2>
            <Slider
              value={rowWidth}
              onValueChange={setRowWidth}
              max={Math.max(400, dynamicDayWidth + 100)}
              min={Math.max(150, dynamicDayWidth - 50)}
              step={10}
              className="w-64"
            />
            <span className="text-sm text-muted-foreground">{rowWidth[0]}px</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={rosterStatus} onCheckedChange={handleRosterStatusChange} className="data-[state=checked]:bg-[#347deb]" />
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenAddJobDialog}
              className="bg-[#347deb] text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={selectedJobs.length === 0}
              className="bg-[#347deb] text-white hover:bg-blue-500"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <Button variant="default" size="sm" className="bg-[#347deb] text-white hover:bg-blue-500" onClick={() => setExportDialogOpen(true)}>
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Single Table with Sticky Header */}
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <Table className="w-full" style={{ tableLayout: 'fixed', minWidth: `${408 + (dayColumns.length * effectiveDayWidth)}px` }}>
            {/* Sticky Header */}
            <TableHeader 
              className="bg-[#347deb] sticky top-0 z-50" 
              style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 50,
                backgroundColor: '#347deb'
              }}
            >
                <TableRow className="bg-[#347deb] hover:bg-[#347deb]">
                <TableHead 
                  className="w-12 text-white bg-[#347deb] sticky left-0 z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: 0, 
                    top: 0, 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                >
                    <Checkbox
                      checked={selectedJobs.length === rosterDaysStructure.length && rosterDaysStructure.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                <TableHead 
                  className="text-white bg-[#347deb] w-[120px] sticky left-[48px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '48px', 
                    top: 0, 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                >
                  Job Title
                </TableHead>
                <TableHead 
                  className="text-white bg-[#347deb] w-[100px] sticky left-[168px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '168px', 
                    top: 0, 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                >
                  Job Code
                </TableHead>
                <TableHead 
                  className="text-white bg-[#347deb] w-[140px] sticky left-[268px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '268px', 
                    top: 0, 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                >
                  Job Seq No
                </TableHead>
                  {dayColumns.map(day => (
                  <TableHead 
                    key={day} 
                    className="text-center text-white bg-[#347deb]" 
                    style={{ 
                      width: `${effectiveDayWidth}px`, 
                      minWidth: `${effectiveDayWidth}px`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 50,
                      backgroundColor: '#347deb'
                    }}
                  >
                      Day {day}
                    </TableHead>
                  ))}
                <TableHead 
                  className="text-white bg-[#347deb] w-[100px]"
                  style={{ 
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    backgroundColor: '#347deb'
                  }}
                >
                  Action
                </TableHead>
                </TableRow>
                <TableRow className="bg-[#347deb] hover:bg-[#347deb]">
                <TableHead 
                  className="bg-[#347deb] w-12 sticky left-0 z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: 0, 
                    top: '40px', 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                ></TableHead>
                <TableHead 
                  className="bg-[#347deb] w-[120px] sticky left-[48px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '48px', 
                    top: '40px', 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                ></TableHead>
                <TableHead 
                  className="bg-[#347deb] w-[100px] sticky left-[168px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '168px', 
                    top: '40px', 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                ></TableHead>
                <TableHead 
                  className="bg-[#347deb] w-[140px] sticky left-[268px] z-[100]" 
                  style={{ 
                    position: 'sticky', 
                    left: '268px', 
                    top: '40px', 
                    zIndex: 100,
                    backgroundColor: '#347deb'
                  }}
                ></TableHead>
                  {dayColumns.map(day => (
                  <TableHead 
                    key={`sub-${day}`} 
                    className="bg-[#347deb]" 
                    style={{ 
                      width: `${effectiveDayWidth}px`, 
                      minWidth: `${effectiveDayWidth}px`,
                      position: 'sticky',
                      top: '40px',
                      zIndex: 50,
                      backgroundColor: '#347deb'
                    }}
                  >
                    <div className="space-y-0.5 text-xs text-white p-1">
                        <div>Day Type</div>
                        <div>Schedule</div>
                        <div>Slots</div>
                        <div>Total Hours</div>
                      </div>
                    </TableHead>
                  ))}
                <TableHead 
                  className="bg-[#347deb] w-[100px]"
                  style={{ 
                    position: 'sticky',
                    top: '40px',
                    zIndex: 50,
                    backgroundColor: '#347deb'
                  }}
                ></TableHead>
                </TableRow>
              </TableHeader>
              
            {/* Scrollable Body */}
                <TableBody>
              {rosterDaysLoading ? null : rosterDaysStructure.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={4 + dayColumns.length} className="p-0 align-middle">
                      <div className="w-full flex justify-center items-center h-16 min-h-16">
                      <span className="text-gray-400 text-base text-center">No data available.</span>
                      </div>
                    </TableCell>
                  </TableRow>
              ) : (
                rosterDaysStructure.map((row) => (
                    <TableRowComponent
                      key={row.ROSTER_ITEM_ID}
                      row={row}
                      onStartEdit={handleStartEdit}
                    />
                ))
              )}
            </TableBody>
            </Table>
        </div>

        {/* Fixed Save Button at Bottom Right */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            size="lg" 
            className="bg-[#347deb] text-white hover:bg-blue-500 shadow-lg"
            onClick={async () => {
              try {
                const response = await post("./../../api/roster/rosterManagement/saveData", rosterDaysStructure);
                if (response.data?.status === 201) {
                  setAlert({ type: 'success', message: 'Data successfully saved' });
                  fetchRosterDaysStructure(roster?.ROSTER_HEADER_ID);
                } else {
                  setAlert({ type: 'error', message: 'Failed to save Data' });
                }
              } catch (error) {
                setAlert({ type: 'error', message: 'Failed to save Data' });
              }
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <MemoAddJobDialog
          open={isAddJobDialogOpen}
          onOpenChange={setIsAddJobDialogOpen}
          ROSTER_HEADER_ID={roster?.ROSTER_HEADER_ID}
          currentUser={currentUser}
          fetchRosterDaysStructure={() => fetchRosterDaysStructure(roster?.ROSTER_HEADER_ID)}
        />

        <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export to Excel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to export this roster to an Excel (.xlsx) file?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-black border border-gray-300 hover:bg-white-500">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#347deb] text-white hover:bg-blue-500"
                onClick={async () => {
                  setExportDialogOpen(false);
                  try {
                    const rosterId = roster?.ROSTER_HEADER_ID || roster?.rosterHeaderId || roster?.id;
                    if (!rosterId) throw new Error("No roster ID found");
                    const response = await get(`./../../api/roster/rosterManagement/downloadData?rosterId=${rosterId}`);
                    if (response.data && Array.isArray(response.data.results)) {
                      const ws = XLSX.utils.json_to_sheet(response.data.results);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "RosterData");
                      XLSX.writeFile(wb, `Roster_${rosterName || rosterId}.xlsx`);
                      setAlert({ type: 'success', message: 'Exported successfully' });
                    } else {
                      setAlert({ type: 'error', message: 'No data to export' });
                    }
                  } catch (err) {
                    setAlert({ type: 'error', message: 'Export failed' });
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
                Are you sure you want to delete the selected job positions? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#347deb] text-white hover:bg-blue-500"
                onClick={async () => {
                  setDeleteDialogOpen(false);
                  await handleDeleteSelected();
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </div>
    </div>
  );
};

export default RosterDetail;
