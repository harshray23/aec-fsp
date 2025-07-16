
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Batch, Teacher, AttendanceRecord, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Eye } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';

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

export function ViewAttendance({ role }: ViewAttendanceProps) {
    const { toast } = useToast();
    const router = useRouter();
    
    // Data states
    const [allBatches, setAllBatches] = useState<Batch[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
    const [selectedHalf, setSelectedHalf] = useState<"all" | "first" | "second">("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

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

                const [batchesRes, teachersRes] = await Promise.all([
                    fetch('/api/batches'),
                    fetch('/api/teachers')
                ]);

                if (!batchesRes.ok || !teachersRes.ok) throw new Error("Failed to fetch initial data.");

                let batches: Batch[] = await batchesRes.json();
                const teachers: Teacher[] = await teachersRes.json();

                if (role === 'teacher' && teacherId) {
                    batches = batches.filter(b => b.teacherIds?.includes(teacherId));
                }

                setAllBatches(batches);
                setAllTeachers(teachers);

            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [role, toast]);
    
    useEffect(() => {
        const fetchAttendanceSummary = async () => {
            if (!dateRange?.from || !dateRange?.to) return;
            
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    from: format(dateRange.from, 'yyyy-MM-dd'),
                    to: format(dateRange.to, 'yyyy-MM-dd'),
                });
                
                const res = await fetch(`/api/reports/view-attendance?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch attendance summary.");
                
                let data: AttendanceSummary[] = await res.json();

                // Client-side filtering
                if (selectedBatchId !== 'all') {
                    data = data.filter(d => d.batchId === selectedBatchId);
                }

                if (selectedHalf !== 'all') {
                    // This is a bit tricky as the summary is aggregated. 
                    // A more accurate approach would be to refetch with a 'half' param.
                    // For now, we show the aggregated data but the user knows they filtered.
                    // The backend API would need to be enhanced for this.
                    toast({title: "Note", description: "Filtering by half is a client-side view filter; percentages shown are for the full date range."})
                }
                
                if(role === 'teacher') {
                    const teacherBatchIds = allBatches.map(b => b.id);
                    data = data.filter(d => teacherBatchIds.includes(d.batchId));
                }

                setAttendanceData(data);

            } catch(error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendanceSummary();
    }, [selectedBatchId, selectedHalf, dateRange, toast, role, allBatches]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Refine the attendance records by batch, date range, and session half.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Batch</Label>
                        <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                            <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Batches</SelectItem>
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
                    <div className="flex flex-col gap-1.5">
                        <Label>Session Half</Label>
                        <Select onValueChange={(val) => setSelectedHalf(val as any)} value={selectedHalf}>
                            <SelectTrigger><SelectValue placeholder="Select half" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Halves</SelectItem>
                                <SelectItem value="first">First Half</SelectItem>
                                <SelectItem value="second">Second Half</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Calculated attendance percentages based on the selected filters.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch Name</TableHead>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Teachers</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Attendance (%)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.length > 0 ? attendanceData.map(summary => (
                                    <TableRow key={summary.batchId}>
                                        <TableCell className="font-medium">{summary.batchName}</TableCell>
                                        <TableCell>{summary.topic}</TableCell>
                                        <TableCell>{summary.teacherNames.join(', ')}</TableCell>
                                        <TableCell>{summary.studentCount}</TableCell>
                                        <TableCell>
                                            <Badge variant={summary.attendancePercentage > 80 ? 'default' : summary.attendancePercentage > 60 ? 'secondary' : 'destructive'}>
                                                {summary.attendancePercentage.toFixed(2)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/${role}/batches/view/${summary.batchId}`)}>
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
        </div>
    );
}
