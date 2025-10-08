
export default function MeetTheDevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-black">
      <div 
        className="absolute inset-0 z-0 animate-fade-in-out"
        style={{
            backgroundImage: 'radial-gradient(circle at top right, hsl(220, 63%, 33%) 0%, transparent 40%), radial-gradient(circle at bottom left, hsl(220, 63%, 33%) 0%, transparent 50%)',
            animation: 'fade-in-out 12s ease-in-out infinite',
        }}
      ></div>
      <style>
        {`
            @keyframes fade-in-out {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 0.7; }
            }
            .animate-fade-in-out {
                animation: fade-in-out 12s ease-in-out infinite;
            }
        `}
      </style>
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
