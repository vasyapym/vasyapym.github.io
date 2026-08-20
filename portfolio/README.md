# Selected Experiments

A portfolio shell for small experiments and self-contained projects.

The shell discovers project modules from `projects/*/project.ts`. A new project can add its own descriptor and page without adding a project-specific branch to the shell. Shared contracts live in `contracts/`, while each project's implementation stays under its own directory.

## Run the projects

Start the Code Layout analyzer service:

```bash
cd portfolio/projects/code-layout/service
go run .
```

In a second terminal, start the React shell:

```bash
npm --prefix portfolio install
npm --prefix portfolio run dev
```

Open <http://localhost:5173>. The Assembly field is the main route; Practice Map is available at <http://localhost:5173/projects/practice-map>, and Code Layout is available at <http://localhost:5173/projects/code-layout>. The shell runs on port `5173`; Code Layout uses `8082`.

## Structure

```text
portfolio/
├── contracts/       shared module interfaces
├── projects/        self-contained pet projects
│   ├── code-layout/ source layout summarizer and Go adapter
│   └── practice-map/ local-first technical practice dashboard
└── shell/           React/Vite landing page and project host
```
