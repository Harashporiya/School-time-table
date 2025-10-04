import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Timetable Management System',
  description: 'Admin portal for managing school timetables, teachers, and classes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">
                    Timetable System
                  </span>
                </Link>

                <div className="flex items-center space-x-2">
                  <Link href="/teachers">
                    <Button variant="ghost">Teachers</Button>
                  </Link>
                  <Link href="/classes">
                    <Button variant="ghost">Classes</Button>
                  </Link>
                  <Link href="/timetable">
                    <Button variant="ghost">Create Timetable</Button>
                  </Link>
                  <Link href="/view-timetable">
                    <Button variant="ghost">View by Class</Button>
                  </Link>
                  <Link href="/teacher-timetable">
                    <Button variant="default">View by Teacher</Button>
                  </Link>
                  <Link href="/time-period">
                    <Button variant="default">Periods</Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
