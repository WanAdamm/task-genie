export default function LandingPage() {
  return (
    <main className="bg-[#faf8ff] pt-10">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-10 lg:py-22 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e2e7ff] rounded-full border border-outline-variant/15">
            <span className="material-symbols-outlined text-sm text-primary">
              auto_awesome
            </span>
            <span className="text-xs text-[#0050d4] font-bold tracking-wider">
              AI-DRIVEN ACADEMIC EXCELLENCE
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl text-[#113069] font-black leading-tight">
            Master Your{" "}
            <span className="text-[#0051d7] bg-gradient-to-br from-primary to-primary-dim bg-clip-text">
              Deadlines
            </span>{" "}
            with AI
          </h1>

          <p className="text-xl max-w-lg">
            Upload your prompt, sync with Google Calendar, and reclaim your time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">
                upload_file
              </span>
              Upload Assignment
            </button>

            <button className="border px-8 py-4 rounded-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">
                play_circle
              </span>
              See Demo
            </button>
          </div>
        </div>

        <div className="relative">
          <img
            className="rounded-xl w-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCN4jwbw7W8UARPMlRNnuCM5rS-DoaVkqzIcqde5DiHXNU-ka3H_Nnj55dpNgpBmqIWziG5aorx74yZ3UXnvGB2MqawctgkC1uNv0TH-ikQi_Gul_f0XNs8yiXPRY2BFPxkmkarKnBCSQoc7IXJ0wIvX5vPE5ITBJ7nmm4qtz0gaQEWzPhd5aHS99GrWQNaYr3kaGJc9aSmBn5bJNa5vSohRFKWFqZc_rtV2VdAJaPeuuXnBP4nFRy8l9JprFIHrFAdQF3PG2MZWPM"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold">
              Architect Your Semester
            </h2>
            <p className="max-w-2xl mx-auto">
              Focus on the material while we handle the logistics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="p-6 rounded-xl bg-white shadow">
              <span className="material-symbols-outlined text-3xl text-primary">
                schema
              </span>
              <h3 className="font-bold text-xl mt-4">
                AI Task Breakdown
              </h3>
              <p className="text-sm mt-2">
                Automatically break assignments into structured tasks.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white shadow">
              <span className="material-symbols-outlined text-3xl text-primary">
                calendar_clock
              </span>
              <h3 className="font-bold text-xl mt-4">
                Timeline Generation
              </h3>
              <p className="text-sm mt-2">
                Smart scheduling based on workload and deadlines.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white shadow">
              <span className="material-symbols-outlined text-3xl text-primary">
                sync_alt
              </span>
              <h3 className="font-bold text-xl mt-4">
                Calendar Sync
              </h3>
              <p className="text-sm mt-2">
                Sync tasks directly to Google Calendar.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">
          The Three Steps to Clarity
        </h2>

        <div className="grid md:grid-cols-3 gap-12 text-center">

          <div>
            <div className="text-3xl font-black">01</div>
            <h3 className="font-bold mt-4">Upload prompt</h3>
            <p className="text-sm mt-2">
              Paste assignment or upload PDF.
            </p>
          </div>

          <div>
            <div className="text-3xl font-black">02</div>
            <h3 className="font-bold mt-4">Generate roadmap</h3>
            <p className="text-sm mt-2">
              AI creates step-by-step plan.
            </p>
          </div>

          <div>
            <div className="text-3xl font-black">03</div>
            <h3 className="font-bold mt-4">Sync to calendar</h3>
            <p className="text-sm mt-2">
              Push tasks into your schedule.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-black text-white rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-black">
            Join the Cognitive Elite
          </h2>
          <p className="max-w-xl mx-auto">
            Start your AI-powered semester today.
          </p>
          <button className="bg-primary px-8 py-4 rounded-xl font-bold">
            Get Started for Free
          </button>
        </div>
      </section>

    </main>
  )
}