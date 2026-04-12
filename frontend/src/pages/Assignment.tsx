export default function Assignment() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-24 md:px-8">
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
                    0 / 2000 words
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

                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                        Course Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cognitive Psychology 101"
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
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
                            className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Assignment Type
                        </label>
                        <select className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                          <option>Essay</option>
                          <option>Lab Report</option>
                          <option>Final Project</option>
                          <option>Discussion Post</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Priority Level
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-surface-container-low px-4 py-3 text-[10px] font-bold text-on-surface/50 transition-all hover:bg-primary/10 hover:text-primary"
                          >
                            LOW
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-primary/10 px-4 py-3 text-[10px] font-bold text-primary ring-1 ring-primary/20"
                          >
                            MED
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-surface-container-low px-4 py-3 text-[10px] font-bold text-on-surface/50 transition-all hover:bg-primary/10 hover:text-primary"
                          >
                            HIGH
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                          Difficulty
                        </label>

                        <div className="flex items-center gap-2 pt-1.5">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                            <div className="h-full w-2/3 bg-primary" />
                          </div>
                          <span className="whitespace-nowrap text-xs font-bold text-on-surface">
                            Hard
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 py-3 font-headline text-sm font-extrabold tracking-wide text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
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
