# Procrastination Certification Authority (P.C.A.)

> Doing nothing. Officially.

A self-contained parody app for the GDG MAD **Dumb Ideas Challenge**. File a claim for an unfinished task, get a mathematically questionable procrastination score, run through a fake approval workflow, and generate an official-looking certificate for accomplishing absolutely nothing.

## Live demo

After the GitHub Pages workflow succeeds, visit:

**https://dheerajtechie.github.io/procrastination-certification-authority/**

If that URL is not live yet, open the repository's **Actions** tab and inspect the latest **Test and deploy to GitHub Pages** run. A green run means the website deployment completed; a failed run includes logs explaining what needs attention.

## Run locally

No package installation, API key, server, or build command is required.

1. Download or clone this repository.
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.
3. Enter a name and a task you avoided, then submit the form.
4. Review the score, case ID, fictional approval steps, and case report.
5. View or print the certificate, download a standalone SVG certificate, and export your local case archive as JSON.

## Features

- Responsive, dark, mock-government interface.
- Procrastination index based on time avoided, distractions, excuse category, task length, and confession length.
- Random excuse generator.
- Fictional case IDs, score classifications, report text, and approval workflow.
- Certificate preview, browser print / Save as PDF, and standalone SVG download.
- Local case archive stored in the current browser using `localStorage`.
- JSON archive export and local archive clearing.
- Interactive parody appeals process.
- No third-party runtime dependencies, API keys, tracking, or backend.

## Deployment

The included GitHub Actions workflow automatically smoke-tests the app and deploys it to GitHub Pages when code is pushed to `main`.

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open the **Actions** tab and watch **Test and deploy to GitHub Pages**.
4. Once the run is green, open the live demo link above.

The workflow first checks JavaScript syntax, required page elements, duplicate HTML IDs, and wiring to expected features. Deployment only proceeds if these checks pass.

## Data and privacy

Case records stay in the current browser's local storage; they are not uploaded to a server. Export your archive before clearing browser data if you want to keep the records. The scoring system is a humorous heuristic, not a validated measure of productivity.

## Technology

Vanilla HTML, CSS, and JavaScript, with a dependency-free Node.js smoke test in GitHub Actions.

## Disclaimer

P.C.A. is fictional parody software and is not affiliated with any government agency. The certificates are for entertainment and have no legal standing.

## Challenge pitch

The Procrastination Certification Authority is an unnecessarily over-engineered institution for certifying that you did nothing. It investigates excuses, calculates a scientifically questionable score, runs a fake approval workflow, and issues certificates for tasks that remain magnificently unfinished.

## Build-in-public

A draft caption and a short demo shot list are available in [BUILD-IN-PUBLIC.md](BUILD-IN-PUBLIC.md). Replace the placeholder with the real deployed demo URL and tag `@gdgmad` when publishing.
