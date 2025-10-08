
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Code, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const developers = [
  { name: 'Harsh Ray', role: 'Backend and Automation Engineer', department: 'AIML', image: '/iiimg1.jpg' },
  { name: 'Sanjay Sharma', role: 'Backend Engineer', department: 'CSE', image: '/iiimg2.jpg' },
  { name: 'Harsh Agarwalla', role: 'Testing and Frontend Engineer', department: 'IT', image: '/iiimg3.jpg' },
  { name: 'Harsh Sahu', role: 'Frontend Engineer', department: 'IT', image: '/img4.jpg' },
  { name: 'Prerna', role: 'Database Engineer', department: 'CSE', image: '/img5.jpg' },
  { name: 'Princi Kumari', role: 'Designer', department: 'CSE', image: '/img6.jpg' },
];

export default function MeetTheDevelopersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Meet the Developers"
        description="This project was brought to life by a dedicated team of student developers."
        icon={Code}
        actions={
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {developers.map((dev) => (
          <Card key={dev.name} className="text-center overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl">
            <Image 
                src={dev.image} 
                alt={dev.name} 
                width={400} 
                height={300} 
                className="w-full h-64 object-cover" 
                data-ai-hint="developer portrait"
            />
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg text-foreground">{dev.name}</h3>
              <p className="text-sm font-medium text-primary">{dev.department}</p>
              <p className="text-sm text-muted-foreground mt-1">{dev.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const metadata = {
    title: "Meet The Developers - AEC FSP",
};
