
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Batch, Teacher, AttendanceRecord, UserRole, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, Clock, Users, BookOpen } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, parseISO, isWithinInterval, eachDayOfInterval, startOfDay, endOfDay, isValid } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { DEPARTMENTS } from '@/lib/constants';

interface ViewAttendanceProps {
    role: 'admin' | 'teacher';
}

interface AttendanceSummary {
    batchId: string;
    batchName: string;
    topic: string;
    teacherNames: string[];
    studentCount: number;
    totalPossibleSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
}

interface DailyAttendanceDetail {
    studentId: string;
    studentName: string;
    rollNumber: string;
    firstHalfStatus?: 'present' | 'absent' | 'late';
    secondHalfStatus?: 'present' | 'absent' | 'late';
}

const getStatusBadge = (status?: 'present' | 'absent' | 'late') => {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    switch (status) {
        case "present": return <Badge variant="default" className="w-24 justify-center"><CheckCircle className="mr-1 h-4 w-4" />Present</Badge>;
        case "absent": return <Badge variant="destructive" className="w-24 justify-center"><XCircle className="mr-1 h-4 w-4" />Absent</Badge>;
        case "late": return <Badge variant="secondary" className="w-24 justify-center"><AlertTriangle className="mr-1 h-4 w-4" />Late</Badge>;
    }
};


export function ViewAttendance({ role }: ViewAttendanceProps) {
    const { toast } = useToast();
    const router = useRouter();
    
    // Data states
    const [allBatches, setAllBatches] = useState<Batch[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [dailyAttendanceDetails, setDailyAttendanceDetails] = useState<DailyAttendanceDetail[]>([]);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // Filter states
    const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Dialog states
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<Batch | null>(null);
    const [detailsDate, setDetailsDate] = useState<Date | undefined>(undefined);
    
    // Set initial date range on client-side to prevent hydration mismatch
    useEffect(() => {
        setDateRange({
            from: subDays(new Date(), 29),
            to: new Date(),
        });
        setDetailsDate(new Date());
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                let teacherId = null;
                if (role === 'teacher') {
                    const storedUser = localStorage.getItem("currentUser");
                    if (storedUser) {
                        teacherId = JSON.parse(storedUser).id;
                    }
                }

                const [batchesRes, studentsRes, attendanceRes] = await Promise.all([
                    fetch('/api/batches'),
                    fetch('/api/students?limit=99999'),
                    fetch('/api/attendance')
                ]);

                if (!batchesRes.ok || !studentsRes.ok || !attendanceRes.ok) throw new Error("Failed to fetch initial data.");

                let batches: Batch[] = await batchesRes.json();
                if (role === 'teacher' && teacherId) {
                    batches = batches.filter(b => b.teacherIds?.includes(teacherId as string));
                }
                
                // Admins see all batches, teachers only see their assigned ones.
                const userSpecificBatches = role === 'admin' 
                    ? batches 
                    : batches.filter(b => b.teacherIds?.includes(teacherId as string));


                setAllBatches(userSpecificBatches);
                setAllStudents((await studentsRes.json()).students);
                setAllAttendanceRecords(await attendanceRes.json());

            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [role, toast]);
    
    const attendanceSummaryData = useMemo<AttendanceSummary[]>(() => {
        let relevantBatches = selectedBatchId === 'all' ? allBatches : allBatches.filter(b => b.id === selectedBatchId);
        
        const filteredAttendance = allAttendanceRecords.filter(rec => {
            const recDate = parseISO(rec.date);
            return dateRange?.from && dateRange?.to && isWithinInterval(recDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
        });

        const summaryMap = new Map<string, AttendanceSummary>();
        
        relevantBatches.forEach(batch => {
            summaryMap.set(batch.id, {
                batchId: batch.id,
                batchName: batch.name,
                topic: batch.topic,
                teacherNames: [], // Will populate later
                studentCount: batch.studentIds?.length || 0,
                totalPresent: 0,
                totalAbsent: 0,
                totalLate: 0,
                attendancePercentage: 0,
                totalPossibleSessions: 0 // Placeholder
            });
        });
        
        filteredAttendance.forEach(record => {
            const summary = summaryMap.get(record.batchId);
            if (summary) {
                if (record.status === 'present') summary.totalPresent++;
                else if (record.status === 'absent') summary.totalAbsent++;
                else if (record.status === 'late') summary.totalLate++;
            }
        });

        return Array.from(summaryMap.values()).map(summary => {
            const totalMarked = summary.totalPresent + summary.totalAbsent + summary.totalLate;
            const percentage = totalMarked > 0 ? ((summary.totalPresent + summary.totalLate) / totalMarked) * 100 : 0;
            return { ...summary, attendancePercentage: percentage };
        });

    }, [selectedBatchId, dateRange, allBatches, allAttendanceRecords]);
    
    // Effect to update date range when a specific batch is selected
    useEffect(() => {
        if (selectedBatchId !== 'all') {
            const batch = allBatches.find(b => b.id === selectedBatchId);
            if (batch && batch.startDate) {
                const batchStartDate = parseISO(batch.startDate);
                if(isValid(batchStartDate)) {
                    setDateRange({ from: batchStartDate, to: new Date() });
                }
            }
        } else {
             setDateRange({ from: subDays(new Date(), 29), to: new Date() });
        }
    }, [selectedBatchId, allBatches]);
    
     // Effect to fetch details for the dialog
    useEffect(() => {
        if (!isDetailsDialogOpen || !selectedBatchForDetails || !detailsDate) return;
        
        const fetchDetails = () => {
            setIsDetailsLoading(true);
            const studentsInBatch = allStudents.filter(s => s.batchIds?.includes(selectedBatchForDetails.id));
            const recordsForDate = allAttendanceRecords.filter(r => r.date === format(detailsDate, 'yyyy-MM-dd') && r.batchId === selectedBatchForDetails.id);
            
            const studentDetailsMap = new Map<string, DailyAttendanceDetail>();

            studentsInBatch.forEach(student => {
                studentDetailsMap.set(student.id, {
                    studentId: student.id,
                    studentName: student.name,
                    rollNumber: student.rollNumber || 'N/A',
                });
            });

            recordsForDate.forEach(record => {
                const detail = studentDetailsMap.get(record.studentId);
                if (detail) {
                    if (record.batchHalf === 'first') {
                        detail.firstHalfStatus = record.status;
                    } else if (record.batchHalf === 'second') {
                        detail.secondHalfStatus = record.status;
                    }
                }
            });

            setDailyAttendanceDetails(Array.from(studentDetailsMap.values()).sort((a,b) => a.rollNumber.localeCompare(b.rollNumber)));
            setIsDetailsLoading(false);
        };

        fetchDetails();

    }, [isDetailsDialogOpen, selectedBatchForDetails, detailsDate, allStudents, allAttendanceRecords]);


    const handleViewDetailsClick = (batchId: string) => {
        const batch = allBatches.find(b => b.id === batchId);
        if (batch) {
            setSelectedBatchForDetails(batch);
            setDetailsDate(dateRange?.to || new Date()); // Start with the last day of the range
            setIsDetailsDialogOpen(true);
        }
    };

    const handleDateChangeInDialog = (direction: 'prev' | 'next') => {
        if (!detailsDate) return;
        const interval = eachDayOfInterval({
            start: dateRange?.from || new Date(),
            end: dateRange?.to || new Date(),
        });
        const currentIndex = interval.findIndex(d => format(d, 'yyyy-MM-dd') === format(detailsDate, 'yyyy-MM-dd'));
        if (direction === 'next' && currentIndex < interval.length - 1) {
            setDetailsDate(interval[currentIndex + 1]);
        }
        if (direction === 'prev' && currentIndex > 0) {
            setDetailsDate(interval[currentIndex - 1]);
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Refine the attendance records by batch and date range.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Batch</Label>
                        <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                            <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All My Batches</SelectItem>
                                {allBatches.map(batch => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex flex-col gap-1.5">
                        <Label>Date Range</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={"w-full justify-start text-left font-normal"}
                                disabled={!dateRange}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date range</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Calculated attendance percentages based on the selected filters.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || !dateRange ? (
                        <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch Name</TableHead>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Attendance (%)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceSummaryData.length > 0 ? attendanceSummaryData.map(summary => (
                                    <TableRow key={summary.batchId}>
                                        <TableCell className="font-medium">{summary.batchName}</TableCell>
                                        <TableCell>{summary.topic}</TableCell>
                                        <TableCell>{summary.studentCount}</TableCell>
                                        <TableCell>
                                            <Badge variant={summary.attendancePercentage > 80 ? 'default' : summary.attendancePercentage > 60 ? 'secondary' : 'destructive'}>
                                                {summary.attendancePercentage.toFixed(2)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetailsClick(summary.batchId)}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No attendance records found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {selectedBatchForDetails && (
                 <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Attendance Details: {selectedBatchForDetails.name}</DialogTitle>
                            <DialogDescription>
                                {selectedBatchForDetails.topic}
                            </DialogDescription>
                        </DialogHeader>

                        <Card className="flex-shrink-0">
                            <CardContent className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary"/> <strong>Topic:</strong> {selectedBatchForDetails.topic}</p>
                                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> <strong>1st Half:</strong> {selectedBatchForDetails.startTimeFirstHalf} - {selectedBatchForDetails.endTimeFirstHalf}</p>
                                {selectedBatchForDetails.startTimeSecondHalf && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> <strong>2nd Half:</strong> {selectedBatchForDetails.startTimeSecondHalf} - {selectedBatchForDetails.endTimeSecondHalf}</p>}
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between p-2 border-b">
                             <Button variant="outline" size="icon" onClick={() => handleDateChangeInDialog('prev')} disabled={!detailsDate}><ChevronLeft /></Button>
                             <div className="font-semibold text-lg">{detailsDate ? format(detailsDate, 'PPP') : 'Select a date'}</div>
                             <Button variant="outline" size="icon" onClick={() => handleDateChangeInDialog('next')} disabled={!detailsDate}><ChevronRight /></Button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto">
                            {isDetailsLoading ? <LoadingSpinner/> : (
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Roll No.</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>First Half</TableHead>
                                            <TableHead>Second Half</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dailyAttendanceDetails.map(detail => (
                                            <TableRow key={detail.studentId}>
                                                <TableCell>{detail.rollNumber}</TableCell>
                                                <TableCell>{detail.studentName}</TableCell>
                                                <TableCell>{getStatusBadge(detail.firstHalfStatus)}</TableCell>
                                                <TableCell>{getStatusBadge(detail.secondHalfStatus)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {dailyAttendanceDetails.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center h-24">No attendance marked for this day.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}

    

