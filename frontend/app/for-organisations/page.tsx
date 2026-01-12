"use client"

import { BarChart3, Users2, Zap, Check } from "lucide-react"

export default function ForOrganisationsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold text-sm tracking-wider uppercase mb-4 block">For Organisations</span>
              <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] mb-6 leading-[1.1]">
                Amplify your mission with reliable volunteers.
              </h1>
              <p className="text-lg text-gray-500 mb-8">
                Kindly provides the tools you need to recruit, manage, and retain volunteers efficiently. Focus on your cause, not the paperwork.
              </p>
              <div className="space-y-4">
                {["Automated Attendance Tracking", "Volunteer Database Access", "Impact Reporting Tools"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-[#1d1d1f] font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#f5f5f7] p-8 rounded-3xl relative overflow-hidden">
                {/* Decorative UI Mockup */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users2 className="w-6 h-6 text-blue-600"/>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1d1d1f]">128</div>
                            <div className="text-xs text-gray-500 uppercase">Volunteers Today</div>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-3/4"></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                            <Zap className="w-6 h-6 text-amber-600"/>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1d1d1f]">98%</div>
                            <div className="text-xs text-gray-500 uppercase">Turnout Rate</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}