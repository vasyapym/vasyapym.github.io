# Selected Experiments

A portfolio shell for small experiments and self-contained projects.

The shell discovers project modules from `projects/*/project.ts`. A new project can add its own descriptor and page without adding a project-specific branch to the shell. Shared contracts live in `contracts/`, while each project's implementation stays under its own directory.

## Run the first project

From the repository root, start the Go analyzer:

```bash
cd portfolio/projects/text-lens/service
go run .
```

In a second terminal, install and start the React shell:

```bash
npm --prefix portfolio install
npm --prefix portfolio run dev
```

Open <http://localhost:5173> and choose **Text Lens**. The shell runs on port `5173`; the Text Lens HTTP adapter runs on port `8081`.

## Structure

```text
portfolio/
├── contracts/       shared module interfaces
├── projects/        self-contained pet projects
└── shell/           React/Vite landing page and project host
```
