
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Users, BookOpen, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Batch, Student, Teacher } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";

export default function EnrollInBatchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const batchId = params.batchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Check for logged-in user and fetch their fresh profile to avoid stale data
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === USER_ROLES.STUDENT && parsedUser.id) {
          try {
            const studentRes = await fetch(`/api/students/profile?studentId=${parsedUser.id}`);
            if (studentRes.ok) {
              const freshStudent: Student = await studentRes.json();
              setStudent(freshStudent);
            } else {
              console.warn("Could not fetch fresh student profile, using localStorage data.", await studentRes.text());
              setStudent(parsedUser); // Fallback to localStorage data
            }
          } catch (e) {
            console.error("Error fetching fresh student profile, using localStorage data:", e);
            setStudent(parsedUser); // Fallback on network error
          }
        }
      }

      // 2. Fetch batch details
      if (batchId) {
        try {
          const batchRes = await fetch(`/api/batches/${batchId}`);
          if (!batchRes.ok) throw new Error("Batch not found or invalid link.");
          const batchData: Batch = await batchRes.json();
          setBatch(batchData);

          if (batchData.teacherIds && batchData.teacherIds.length > 0) {
            const teachersRes = await fetch('/api/teachers');
            if(teachersRes.ok) {
                const allTeachers: Teacher[] = await teachersRes.json();
                const assignedTeachers = allTeachers.filter(t => batchData.teacherIds.includes(t.id));
                setTeachers(assignedTeachers);
            }
          }
        } catch (err: any) {
          setError(err.message);
        }
      }
      setIsLoading(false);
    };

    if (batchId) {
        fetchData();
    } else {
        setIsLoading(false);
        setError("No Batch ID provided in the link.");
    }
  }, [batchId]);

  const handleEnroll = async () => {
    if (!student || !batch) return;
    setIsEnrolling(true);
    try {
        const response = await fetch('/api/batches/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batchId: batch.id, studentId: student.id }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to enroll in batch.');
        }

        toast({
            title: "Enrollment Successful!",
            description: `You have successfully joined the batch: ${batch.name}.`,
        });

        // Update student in local storage
        const updatedStudent = { ...student, batchIds: [...(student.batchIds || []), batch.id] };
        localStorage.setItem("currentUser", JSON.stringify(updatedStudent));

        router.push('/student/dashboard');

    } catch (error: any) {
        toast({ title: "Enrollment Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsEnrolling(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading batch details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (!batch) {
      return <p>Batch details could not be loaded.</p>;
    }

    if (!student) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Login Required</AlertTitle>
          <AlertDescription>
            You must be logged in as a student to join this batch.
          </AlertDescription>
          <div className="mt-4">
             <Button asChild>
                <Link href={`/login?role=student&redirect=/enroll/${batchId}`}>Login as Student</Link>
            </Button>
          </div>
        </Alert>
      );
    }
    
    if (student.batchIds?.includes(batch.id)) {
       return (
        <Alert variant="default">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>
            Already Enrolled
          </AlertTitle>
          <AlertDescription>
            You are already enrolled in this batch.
          </AlertDescription>
           <div className="mt-4">
             <Button asChild variant="outline">
                <Link href="/student/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </Alert>
       )
    }

    // Main enrollment confirmation view
    return (
      <>
        <CardHeader>
          <CardTitle>Join Batch: {batch.name}</CardTitle>
          <CardDescription>Please confirm you want to enroll in this batch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary"/> <strong>Topic:</strong> {batch.topic}</p>
            <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> <strong>Teachers:</strong> {teachers.map(t => t.name).join(', ') || 'N/A'}</p>
          </div>
          <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full">
            {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isEnrolling ? "Enrolling..." : "Confirm and Join Batch"}
          </Button>
        </CardContent>
      </>
    );
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
           {renderContent()}
        </Card>
    </div>
  );
}
