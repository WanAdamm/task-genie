# TaskGenie

AI system that turns assignment prompts into executable timelines with smart scheduling and calendar sync.

---

## 🚀 Overview

TaskGenie is a web-based productivity system that helps students manage assignments more effectively.

Users can upload assignment prompts, and the system will:

* Generate a structured execution roadmap using AI
* Break down tasks into actionable steps
* Optimize timelines across multiple assignments
* Sync schedules to Google Calendar
* Send reminders before deadlines

The goal is simple: **reduce overwhelm and improve execution.**

---

## 🧠 Key Features

### 📄 Assignment → Plan

* Upload assignment briefs (text/PDF)
* AI extracts deliverables, milestones, and requirements
* Generates a structured execution roadmap

### 🗓 Smart Scheduling

* Converts tasks into time blocks
* Distributes workload across available time
* Syncs directly with Google Calendar

### ⚖️ Multi-Assignment Optimization

* Handles multiple assignments simultaneously
* Minimizes context switching
* Detects overload and scheduling conflicts

### 🔁 Replanning

* Automatically adjusts schedules when:

  * new assignments are added
  * deadlines change
  * plans are modified

### 📬 Reminders

* Sends email notifications before deadlines
* Keeps users on track without manual tracking

---

## 🏗 Architecture

The system is split into 4 main components:

### 1. Frontend (UI)

* React + Tailwind + shadcn/ui
* Handles user interaction, visualization, and approval flow

### 2. Planner Engine

* LangGraph-based workflow
* Responsible for:

  * parsing assignment briefs
  * generating task breakdowns
  * sequencing and optimization logic

### 3. Workflow Engine

* Inngest
* Handles:

  * background processing
  * async plan generation
  * retries and scheduling
  * calendar sync jobs

### 4. Platform Layer

* Firebase (Auth + NoSQL storage)
* Google Calendar API
* Manages:

  * user data
  * plans
  * calendar integration

---

## 🧩 Tech Stack

* **Frontend:** React, Tailwind CSS, shadcn/ui
* **AI Orchestration:** LangGraph
* **Workflow Automation:** Inngest
* **Backend / Storage:** Firebase (Auth + Firestore)
* **Integrations:** Google Calendar API

---

## ⚙️ Setup (Local Development)

### 1. Clone the repo

```bash
git clone https://github.com/WanAdamm/task-genie.git
cd task-genie
```

### 2. Install dependencies (frontend)

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment variables

Create a `.env` file in relevant services:

* Firebase config
* OpenAI / LLM API key
* Google Calendar credentials
* Inngest keys

---

## 📂 Project Structure

```txt
task-genie/
 ├── frontend/        # React app
 ├── planner/         # LangGraph logic
 ├── workflows/       # Inngest functions
 ├── platform/        # Firebase + integrations
 ├── README.md
```

---

## 🎯 Roadmap

* [ ] Assignment upload (text + PDF parsing)
* [ ] AI roadmap generation
* [ ] Calendar integration
* [ ] Multi-assignment optimization
* [ ] Email reminder system
* [ ] UI/UX polish

---

## 💡 Vision

Most students don’t struggle with understanding assignments.
They struggle with **execution and time management**.

TaskGenie bridges that gap by turning static assignment briefs into:

* structured plans
* executable timelines
* automated schedules

---

## 📌 Status

🚧 In active development (April build sprint)

---

## 🤝 Contribution

This is currently a solo project, but suggestions and ideas are welcome.

---

## 📄 License

MIT License
