# 🚀 Finixy Workflow Builder

A powerful, intuitive workflow automation builder built with **React**, **TypeScript**, and **Vite**. This project allows users to design and visualize complex logic flows with ease.

## ✨ Features

* **Drag-and-Drop Interface:** Build workflows visually.
* **TypeScript Powered:** Full type safety for a robust developer experience.
* **Fast HMR:** Powered by Vite for near-instant browser updates.
* **Scalable Architecture:** Clean component structure ready for production.

---

## 🛠️ Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

Make sure you have **Node.js** (v18 or higher) installed.

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/manjitnaskar-spacemarvel/Finixy_workflow.git
cd Finixy_workflow

```


2. **Install dependencies:**
```bash
npm install

```



### Development

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev

```

The application will be available at `http://localhost:5173`.

---

## Project Structure

```
├── public
├── src
│   ├── assets
│   ├── components
│   │   ├── ChatPanel.tsx
│   │   ├── ConfigPanel.tsx
│   │   ├── CustomEdge.tsx
│   │   ├── CustomNode.tsx
│   │   ├── Header.tsx
│   │   ├── NodePalette.tsx
│   │   ├── Sidebar.tsx
│   │   └── WorkflowCanvas.tsx
│   ├── services
│   │   └── api.ts
│   ├── store
│   │   └── WorkflowContext.tsx
│   ├── types
│   │   └── index.ts
│   ├── utils
│   │   ├── constants.ts
│   │   ├── workflowMapper.ts
│   │   └── workflowParser.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── Finixy_workflow_builder - Shortcut.lnk
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Deployment

To create a production-ready build:

```bash
npm run build

```