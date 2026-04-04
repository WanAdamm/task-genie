export default function Insights() {
  return (
    <div className="min-h-screen bg-background px-8 py-6 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">Assignments &gt; AI Roadmap</p>
          <h1 className="text-3xl font-bold">Academic Curator Roadmap</h1>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
            Edit Plan
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            Sync Calendar
          </button>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Assignment Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between">
            <div>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                Current Focus
              </span>
              <h2 className="text-xl font-bold mt-2">
                Modernist Architecture & Urban Planning
              </h2>
              <p className="text-sm text-gray-500">
                ARC-402: Advanced Theory & Criticism
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Final Deadline</p>
              <p className="text-lg font-bold text-red-500">Dec 14, 2024</p>
            </div>
          </div>

          <div className="flex gap-8 border-t pt-4">
            <div>
              <p className="text-xs text-gray-500">Total Effort</p>
              <p className="font-bold">42 Hours</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Complexity</p>
              <p>⭐⭐⭐⭐☆</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-blue-600 font-semibold">On Track</p>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-600 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            ✨ Genie Analysis
          </h3>

          <p className="text-sm text-gray-600">
            You have a high concentration of deadlines in Phase 3. 
            Redistributing effort earlier will reduce late-stage stress.
          </p>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Confidence</span>
              <span className="font-bold text-blue-600">94%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-blue-600 rounded-full w-[94%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold mb-6">Strategic Timeline</h3>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Oct 20 - Kickoff</span>
          <span>Nov 02 - Review</span>
          <span>Nov 18 - Draft</span>
          <span>Dec 01 - Peer Review</span>
          <span className="text-red-500 font-bold">Dec 14 - Final</span>
        </div>

        <div className="mt-4 h-2 bg-gray-200 rounded-full relative">
          <div className="absolute h-2 bg-blue-600 w-[35%] rounded-full"></div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        
        <h3 className="font-bold text-xl">Implementation Phases</h3>

        {/* Phase 1 */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-semibold">Phase 1: Research</h4>
          <p className="text-sm text-gray-500">Completed (3/3)</p>
        </div>

        {/* Phase 2 */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-semibold">Phase 2: Planning</h4>
          <p className="text-sm text-blue-600">In Progress (1/4)</p>
        </div>

        {/* Phase 3 */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3 opacity-70">
          <h4 className="font-semibold">Phase 3: Drafting</h4>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>

        {/* Phase 4 */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3 opacity-70">
          <h4 className="font-semibold">Phase 4: Refinement</h4>
          <p className="text-sm text-gray-500">Final Stage</p>
        </div>
      </div>
    </div>
  )
}