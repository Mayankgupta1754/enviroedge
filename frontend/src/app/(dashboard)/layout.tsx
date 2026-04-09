import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex bg-transparent p-2 md:p-4 gap-3">
      {/* LEFT */}
      <div className="hidden md:block md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 rounded-2xl bg-white/85 backdrop-blur border border-indigo-100/60 shadow-sm dark:bg-slate-900/90 dark:border-slate-700">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2 pb-3 border-b border-indigo-100/80 dark:border-slate-700"
        >
          <Image src="/logo.png" alt="logo" width={32} height={32} />
          <span className="hidden lg:block font-bold text-gray-800 dark:text-slate-100">EnviroEdge AI</span>
        </Link>
        <Menu />
      </div>
      {/* RIGHT */}
      <div className="w-full md:w-[92%] lg:w-[84%] xl:w-[86%] rounded-2xl bg-white/40 border border-indigo-100/60 shadow-sm overflow-auto flex flex-col dark:bg-slate-900/50 dark:border-slate-700">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
