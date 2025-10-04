'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, GraduationCap, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Timetable Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Admin portal for managing teachers, classes, sections, and scheduling timetables efficiently
          </p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Teachers Card */}
          <Link href="/teachers">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Teachers</CardTitle>
                <CardDescription>Manage teacher profiles and subjects</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  View Teachers
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Classes Card */}
          <Link href="/classes">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-500 h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Classes & Sections</CardTitle>
                <CardDescription>Create and manage class sections</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  View Classes
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Timetable Card */}
          <Link href="/timetable">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500 h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Timetable</CardTitle>
                <CardDescription>Schedule and manage timetable slots</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  Manage Timetable
                </Button>
              </CardContent>
            </Card>
          </Link>
          
        </div>

        {/* Features Section */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4">
                <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Conflict Detection</h3>
                <p className="text-sm text-gray-600">
                  Automatic teacher scheduling conflict validation
                </p>
              </div>
             
<Link href="/view-timetable">
  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500 h-full">
    <CardHeader className="text-center pb-4">
      <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-indigo-600" />
      </div>
      <CardTitle className="text-2xl">View Timetable</CardTitle>
      <CardDescription>View complete timetable by class and section</CardDescription>
    </CardHeader>
    <CardContent className="text-center">
      <Button variant="outline" className="w-full">
        View Timetables
      </Button>
    </CardContent>
  </Card>
</Link>
<Link href="/time-period">
  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500 h-full">
    <CardHeader className="text-center pb-4">
      <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-indigo-600" />
      </div>
      <CardTitle className="text-2xl">View period</CardTitle>
      <CardDescription>View complete timetable by class and section</CardDescription>
    </CardHeader>
    <CardContent className="text-center">
      <Button variant="outline" className="w-full">
        View Timetables
      </Button>
    </CardContent>
  </Card>
</Link>

              <div className="text-center p-4">
                <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Teacher Management</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, and organize teacher information
                </p>
              </div>
              
              <div className="text-center p-4">
                <GraduationCap className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Class Organization</h3>
                <p className="text-sm text-gray-600">
                  Structure classes with multiple sections
                </p>
              </div>
              
              <div className="text-center p-4">
                <Calendar className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Weekly Scheduling</h3>
                <p className="text-sm text-gray-600">
                  Grid-based timetable for Monday to Saturday
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Built with Next.js, Express.js, Prisma, PostgreSQL & ShadCN UI
          </p>
        </div>
      </div>
    </div>
  );
}
