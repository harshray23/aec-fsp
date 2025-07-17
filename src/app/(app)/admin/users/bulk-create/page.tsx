
"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Download, Loader2, FileSpreadsheet, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const REQUIRED_COLUMNS_FOR_TEMPLATE = [
  "Student Name", "Student ID", "University Roll No.", "University Registration No.", 
  "Department", "Admission Year", "Current Academic Year", "Email", "WhatsApp No.", "Phone No."
];


export default function BulkCreateStudentsPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'text/csv', // .csv
          'application/vnd.oasis.opendocument.spreadsheet', // .ods
          'text/tab-separated-values' // .tsv
      ];
      if (selectedFile && allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setUploadResult(null); // Clear previous results
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .xlsx, .csv, .ods, or .tsv file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const response = await fetch('/api/students/bulk-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: json }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'An unknown error occurred.');
        }

        setUploadResult(result);
        toast({
          title: "Upload Complete",
          description: `Successfully created ${result.successCount} students. See results below.`,
        });

      } catch (error: any) {
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        setUploadResult(null);
      } finally {
        setIsUploading(false);
        setFile(null); // Reset file input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([REQUIRED_COLUMNS_FOR_TEMPLATE]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentsTemplate");
    XLSX.writeFile(wb, "student_upload_template.xlsx");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bulk Create Students"
        description="Upload an Excel or CSV file to create multiple student accounts at once."
        icon={UploadCloud}
        actions={
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download Template
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Upload Student Data File</CardTitle>
          <CardDescription>
            Download the template to ensure your file has the correct columns. The default password for all new users will be 'Password@123'. Students will be prompted to change it on first login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="student-file">Select File (.xlsx, .csv, .ods, .tsv)</Label>
            <Input id="student-file" type="file" accept=".xlsx, .csv, .ods, .tsv" onChange={handleFileChange} />
          </div>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isUploading ? "Processing..." : "Upload and Create Accounts"}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Summary</CardTitle>
            <CardDescription>
              {uploadResult.successCount} accounts created successfully. 
              {uploadResult.errorCount > 0 && ` ${uploadResult.errorCount} records failed.`}
            </CardDescription>
          </CardHeader>
          {uploadResult.errorCount > 0 && (
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errors Encountered</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      )}

       <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet/>Template Column Guide</CardTitle>
          <CardDescription>Your spreadsheet must have the following columns. The order does not matter.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-1">
          {REQUIRED_COLUMNS_FOR_TEMPLATE.map(col => <p key={col}>- <strong className="text-foreground">{col}</strong></p>)}
          <p className="pt-2 text-primary col-span-2">Note: 'Department' value must be a valid key from the system (e.g., 'CSE', 'IT', 'ECE'). The 'Timestamp' and 'Email Address' columns will be ignored.</p>
        </CardContent>
      </Card>
    </div>
  );
}
