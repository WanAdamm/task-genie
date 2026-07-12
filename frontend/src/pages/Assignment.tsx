import Stepper from "@/components/ui/stepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const priorities = ["LOW", "MED", "HIGH"] as const;
type Priority = (typeof priorities)[number];

export default function Assignment() {
  const navigate = useNavigate();

  // State variables for inputs
  const [courseName, setCourseName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignmentType, setAssignmentType] = useState("Essay");
  const [priority, setPriority] = useState<Priority>("MED");
  const [level, setLevel] = useState(2); // 1: Easy, 2: Medium, 3: Hard
  const [requirements, setRequirements] = useState("");

  // UI state variables
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Derived word count
  const wordCount = requirements.trim() ? requirements.trim().split(/\s+/).length : 0;

  const getDifficultyText = (lvl: number) => {
    switch (lvl) {
      case 1:
        return "Easy";
      case 2:
        return "Medium";
      case 3:
        return "Hard";
      default:
        return "Medium";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseName.trim()) {
      setError("Please specify the Course Name.");
      return;
    }
    if (!dueDate) {
      setError("Please select a valid Due Date.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);
    setLoadingMessage("Analyzing assignment requirements...");

    const messages = [
      "Analyzing assignment requirements...",
      "Retrieving study preferences from settings...",
      "Optimizing study blocks & workload strategy...",
      "Generating personalized calendar events...",
      "Writing study schedule to Firestore..."
    ];

    let currentStep = 1;
    const interval = setInterval(() => {
      if (currentStep < messages.length) {
        currentStep += 1;
        setLoadingStep(currentStep);
        setLoadingMessage(messages[currentStep - 1]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/events/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName,
          dueDate,
          assignmentType,
          priority: priority.toLowerCase(),
          difficulty: level,
          requirements,
        }),
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server returned error ${response.status}`);
      }

      setLoadingStep(5);
      setLoadingMessage("Success! Timeline created.");

      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard/calendar");
      }, 800);

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || "Failed to generate AI plan. Please check your network and API key config.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Premium Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="relative flex flex-col items-center max-w-sm w-full p-8 rounded-2xl border border-outline-variant/10 bg-surface-container-low shadow-2xl text-center">
            {/* Spinning/pulsing animation */}
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl animate-spin" style={{ animationDuration: '3s' }}>
                progress_activity
              </span>
              <span className="absolute text-2xl material-symbols-outlined animate-pulse">
                magic_button
              </span>
            </div>
            
            <h3 className="mb-2 font-headline text-lg font-bold text-on-surface">
              TaskGenie Planning Engine
            </h3>
            
            <p className="text-xs font-semibold text-primary transition-all duration-300">
              {loadingMessage}
            </p>

            {/* Stepped progress dots */}
            <div className="mt-6 flex w-24 gap-3 justify-center">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={`h-2 w-2 rounded-full transition-all duration-500 ${
                    loadingStep >= step ? "bg-primary scale-125" : "bg-outline-variant/20"
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-10 pt-24 md:px-8">
        {/* Error Alert Display */}
        {error && (
          <div className="mb-6 rounded-xl border border-error/20 bg-error-container/10 p-4 text-xs font-semibold text-error flex items-start gap-3 shadow-sm animate-fade-in">
            <span className="material-symbols-outlined text-base">warning</span>
            <div className="flex-1">
              <p className="font-bold mb-0.5">Plan Generation Blocked</p>
              <p className="opacity-80 leading-normal">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-error/60 hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-headline font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary">
                    upload_file
                  </span>
                  Resource Integration
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/40">
                  PDF • IMG • DOCX
                </span>
              </div>

              <div className="group relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/10 bg-surface-container-low/30 px-6 text-center transition-all hover:border-primary/20 hover:bg-surface-container-low/60">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    add_to_drive
                  </span>
                </div>

                <p className="mb-1 font-headline text-lg font-bold text-on-surface">
                  Drop your syllabus or prompt
                </p>
                <p className="max-w-xs text-sm font-medium text-on-surface/50">
                  TaskGenie AI will extract deliverables, rubrics, and key dates
                  automatically.
                </p>

                <div className="mt-6 flex gap-4">
                  <button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-6 py-3 text-xs font-bold text-on-surface transition-all hover:shadow-md">
                    <span className="material-symbols-outlined text-sm">
                      cloud_upload
                    </span>
                    Browse Files
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <h3 className="mb-6 flex items-center gap-2 font-headline font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary">
                  edit_note
                </span>
                Context &amp; Requirements
              </h3>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface/60">
                    Describe the assignment or paste text
                  </span>
                  <textarea
                    rows={6}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Paste the text from your professor's email or the assignment PDF here..."
                    className="w-full resize-none rounded-xl border-none bg-surface-container-low p-4 font-body text-sm text-on-surface placeholder-on-surface/30 focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <div className="flex items-center justify-between py-2">
                  <div className="flex gap-2">
                    <span className="rounded-xl bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                      Word count
                    </span>
                    <span className="rounded-xl bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                      Tone: Academic
                    </span>
                  </div>

                  <p className="text-[10px] font-medium text-on-surface/40">
                    {wordCount} / 2000 words
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h3 className="mb-6 border-b border-outline-variant/10 pb-4 font-headline font-bold text-on-surface">
                  Assignment Blueprint
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                        Course Name
                      </label>
                      <input
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g. Cognitive Psychology 101"
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Due Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Assignment Type
                        </label>
                        <select 
                          value={assignmentType}
                          onChange={(e) => setAssignmentType(e.target.value)}
                          className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface"
                        >
                          <option value="Essay">Essay</option>
                          <option value="Lab Report">Lab Report</option>
                          <option value="Final Project">Final Project</option>
                          <option value="Discussion Post">Discussion Post</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 w-max block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Priority Level
                        </label>

                        <div className="flex gap-2">
                          {priorities.map((levelOption) => {
                            const isActive = priority === levelOption;

                            return (
                              <button
                                key={levelOption}
                                type="button"
                                onClick={() => setPriority(levelOption)}
                                className={`flex-1 rounded-xl px-4 py-3 text-[10px] font-bold transition-all
                                ${
                                  isActive
                                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                    : "bg-surface-container-low text-on-surface/50 hover:bg-primary/10 hover:text-primary"
                                }`}
                              >
                                {levelOption}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Difficulty
                        </label>

                        <div className="flex items-center gap-2 pt-1.5">
                          <Stepper value={level} onChange={setLevel} max={3}/>
                          <span className="whitespace-nowrap text-xs font-bold text-on-surface">
                            {getDifficultyText(level)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 py-3 font-headline text-sm font-extrabold tracking-wide text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        magic_button
                      </span>
                      Generate AI Plan
                    </button>

                    <p className="mt-4 px-4 text-center text-[10px] font-medium leading-relaxed text-on-surface/40">
                      TaskGenie AI will break this down into actionable
                      sub-tasks, suggested readings, and a study timeline.
                    </p>
                  </div>
                </form>
              </section>

              <div className="rounded-xl border border-outline-variant/10 bg-[rgba(250,248,255,0.8)] p-6 shadow-sm backdrop-blur-[20px] md:p-8">
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary">
                    lightbulb
                  </span>

                  <div>
                    <p className="mb-1 text-xs font-bold text-on-surface">
                      Academic Tip
                    </p>
                    <p className="text-xs font-medium leading-relaxed text-on-surface/60">
                      Uploading the <strong>Grading Rubric</strong> helps
                      TaskGenie prioritize the most impactful tasks first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
