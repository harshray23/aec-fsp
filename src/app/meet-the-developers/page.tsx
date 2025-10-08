import { PageHeader } from "@/components/shared/PageHeader";
import { Code, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 font-sans text-white">
      <PageHeader
        title="Meet the Developers"
        description="This project was brought to life by a dedicated team of student developers."
        icon={Code}
        actions={
          <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        }
      />
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        style={{ perspective: '1000px' }}
      >
        {developers.map((dev, index) => (
          <div
            key={dev.name}
            className="group relative h-[28rem] w-full rounded-xl shadow-lg transform-style-3d transition-all duration-500 ease-in-out hover:shadow-2xl hover:[transform:rotateY(-5deg)_rotateX(5deg)]"
          >
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <Image
                src={dev.image}
                alt={dev.name}
                fill
                className="object-cover object-center h-full w-full grayscale transition-all duration-500 ease-in-out group-hover:grayscale-0 group-hover:scale-110"
                data-ai-hint="developer portrait"
              />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100 rounded-xl" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform-style-3d">
              <div className="translate-y-8 opacity-0 transition-all duration-500 ease-in-out group-hover:translate-y-0 group-hover:opacity-100">
                <h3 className="font-bold text-2xl tracking-tight">{dev.name}</h3>
                <p className="text-sm font-medium text-primary-foreground/80">{dev.role}</p>
                <p className="text-xs text-primary-foreground/60">{dev.department}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const metadata = {
    title: "Meet The Developers - AEC FSP",
};
