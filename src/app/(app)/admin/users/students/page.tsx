import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GraduationCap, Filter } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

// Mock Data
const mockStudents = [
  { id: "S001", name: "Aarav Sharma", email: "aarav.sharma@example.com", department: "Computer Science & Engineering", rollNumber: "CSE/20/01", batch: "Alpha", status: "Active" },
  { id: "S002", name: "Diya Patel", email: "diya.patel@example.com", department: "Information Technology", rollNumber: "IT/20/05", batch: "Beta", status: "Active" },
  { id: "S003", name: "Rohan Mehta", email: "rohan.mehta@example.com", department: "Electrical Engineering", rollNumber: "EE/21/12", batch: "Gamma", status: "Inactive" },
  { id: "S004", name: "Priya Kumari", email: "priya.kumari@example.com", department: "Mechanical Engineering", rollNumber: "ME/19/02", batch: "Alpha", status: "Active" },
];

export default function ViewStudentsPage() {
  // Placeholder for filtering logic
  // const [searchTerm, setSearchTerm] = React.useState("");
  // const [selectedDepartment, setSelectedDepartment] = React.useState("");

  // const filteredStudents = mockStudents.filter(student => 
  //   student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
  //   (selectedDepartment === "" || student.department === selectedDepartment)
  // );

  return (
    <div className="space-y-8">
      <PageHeader
        title="View Students"
        description="Browse and search student records in the FSP portal."
        icon={GraduationCap}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>A comprehensive list of all students enrolled in the FSP.</CardDescription>
          <div className="mt-4 flex gap-4">
            <Input placeholder="Search by name or ID..." className="max-w-sm" />
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.label}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Apply Filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map((student) => ( // Replace with filteredStudents when filter logic is live
                <TableRow key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mockStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "View Students - AEC FSP Portal",
};

const Button = ({ children, ...props }: React.ComponentProps<'button'> & {variant?: string}) => <button {...props}>{children}</button>;
const GraduationCap = ({className}: {className?: string}) => <svg className={className} />; // Placeholder
const Filter = ({className}: {className?: string}) => <svg className={className} />; // Placeholder
