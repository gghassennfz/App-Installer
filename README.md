# Gaston Developer Tools Installer

![Gaston Developer Tools Installer](https://via.placeholder.com/800x400?text=Gaston+Developer+Tools+Installer)

A beautiful Material UI desktop application for easy installation of development tools on Windows. Built with Electron, React, and Material UI.

## Features

- **Modern Material UI Design**: Clean, professional interface with proper spacing and typography
- **Organized 3-Column Layout**: Tools organized by category for easy browsing
- **Tool Icons**: Visual representation of each development tool
- **Progress Tracking**: Real-time progress bars for installation status
- **Automated Installation**: Uses Windows Package Manager (winget) for seamless installation
- **Custom Installers**: Special handling for tools that need custom installation steps

## Installation

```bash
# Clone the repository
git clone https://github.com/gghassennfz/DevAppsLib.git

# Navigate to the project directory
cd DevAppsLib

# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode (starts both Vite and Electron)
npm run dev

# Browser-only mode (for UI development)
npm run vite-only

# Build for production
npm run electron:build
```

## Technology Stack

- **React**: UI library for component-based architecture
- **Electron**: Framework for building cross-platform desktop apps
- **Material UI**: Component library for modern design
- **Vite**: Next-generation frontend tooling
- **Windows Package Manager (winget)**: For tool installations

## Project Structure

- `src/`: React application source code
  - `data/`: Tool definitions and icons
  - `App.jsx`: Main application component
- `electron/`: Electron main process code
  - `main.js`: Electron entry point
  - `preload.js`: Preload script for secure IPC
  - `installers.js`: Custom installer implementations

## Created By

Designed and developed by Gaston. 

Copyright © 2025 Gaston. All rights reserved.
