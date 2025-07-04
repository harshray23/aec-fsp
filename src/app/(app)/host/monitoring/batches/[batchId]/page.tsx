"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, CalendarDays, Clock, HomeIcon, Users, ArrowLeft, Briefcase } from "lucide-react";
import type { Batch, Student, Teacher } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DEPARTMENTS } from '@/lib/constants';

interface BatchDetails extends Batch {
    students: Student[];
    teacherNames: string[];
}

export default function HostMonitorBatchDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const batchId = params.batchId as string;
    const { toast } = useToast();

    const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!batchId) return;

        const fetchBatchDetails = async () => {
            setIsLoading(true);
            try {
                const [batchRes, allStudentsRes, allTeachersRes] = await Promise.all([
                    fetch(`/api/batches/${batchId}`),
                    fetch('/api/students?limit=99999'),
                    fetch('/api/teachers')
                ]);

                if (!batchRes.ok) {
                    if (batchRes.status === 404) toast({ title: "Error", description: "Batch not found.", variant: "destructive" });
                    else throw new Error("Failed to fetch batch details.");
                    router.push('/host/monitoring/batches');
                    return;
                }
                const batchData: Batch = await batchRes.json();

                if (!allStudentsRes.ok) throw new Error("Failed to fetch student list.");
                const studentsResponse = await allStudentsRes.json();
                const allStudents: Student[] = studentsResponse.students;
                
                if (!allTeachersRes.ok) throw new Error("Failed to fetch teacher list.");
                const allTeachers: Teacher[] = await allTeachersRes.json();

                const studentsInBatch = allStudents.filter(student => batchData.studentIds?.includes(student.id));
                const teacherNames = batchData.teacherIds.map(id => allTeachers.find(t => t.id === id)?.name).filter(Boolean) as string[];

                setBatchDetails({ ...batchData, students: studentsInBatch, teacherNames });

            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatchDetails();

    }, [batchId, toast, router]);

    const getDepartmentLabel = (deptValue: string) => {
        const dept = DEPARTMENTS.find(d => d.value === deptValue);
        return dept ? dept.label : deptValue;
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <PageHeader title="Loading Batch Details..." icon={Loader2} description="Please wait while we fetch the batch information." />
                <Card><CardContent className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></CardContent></Card>
            </div>
        );
    }
    
    if (!batchDetails) {
        return (
            <div className="space-y-8">
                <PageHeader title="Batch Not Found" icon={Eye} />
                <Card>
                    <CardContent>
                        <p>The batch details could not be loaded. It might have been deleted.</p>
                        <Button onClick={() => router.push('/host/monitoring/batches')} className="mt-4">Back to Batch Monitor</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <PageHeader
                title={batchDetails.name}
                description={`Monitoring details for the batch: ${batchDetails.topic}`}
                icon={Eye}
                actions={
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to List
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>Batch Configuration</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> <strong>Teachers:</strong> {batchDetails.teacherNames.join(', ') || 'N/A'}</div>
                    <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> <strong>Days:</strong> {batchDetails.daysOfWeek.join(', ')}</div>
                    <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> <strong>Time:</strong> {batchDetails.startTime} - {batchDetails.endTime}</div>
                    <div className="flex items-center gap-2"><HomeIcon className="h-5 w-5 text-primary" /> <strong>Room:</strong> {batchDetails.roomNumber || 'N/A'}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users /> Enrolled Students ({batchDetails.students.length})
                    </CardTitle>
                    <CardDescription>
                        List of students currently enrolled in this batch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Roll Number</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Section</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batchDetails.students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.studentId}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.rollNumber}</TableCell>
                                    <TableCell>{getDepartmentLabel(student.department)}</TableCell>
                                    <TableCell>{student.section || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                             {batchDetails.students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        No students are currently enrolled in this batch.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
