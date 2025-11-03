export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-[#8da9c4] rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[#134074] rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-[#13315c] text-lg">{message}</p>
    </div>
  );
}

