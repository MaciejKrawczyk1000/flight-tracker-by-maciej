# AI Rules for flight-path-voyager

This document outlines the core technologies used in this project and provides guidelines for using specific libraries.

## Tech Stack

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **Vite**: A fast build tool that provides an instant development server and optimized builds.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS.
*   **React Router**: For declarative routing within the application.
*   **Mapbox GL JS / React Map GL**: For interactive maps and geospatial data visualization.
*   **Recharts**: A composable charting library built with React components.
*   **React Query**: For efficient data fetching, caching, and synchronization.
*   **Sonner**: A modern toast notification library.
*   **Lucide React**: A library providing a collection of customizable SVG icons.

## Library Usage Rules

When making changes or adding new features, please adhere to the following guidelines for library usage:

*   **UI Components**: Always prioritize `shadcn/ui` components. If a specific component is not available, create a new, small, and focused component using Tailwind CSS.
*   **Styling**: Use Tailwind CSS exclusively for all styling. Avoid writing custom CSS unless absolutely necessary for global styles in `src/index.css` or `src/App.css`.
*   **Routing**: Use `react-router-dom` for all navigation and route management. Keep routes defined in `src/App.tsx`.
*   **Data Fetching & State Management**: Utilize `@tanstack/react-query` for managing server state, data fetching, caching, and synchronization.
*   **Icons**: Use icons from `lucide-react`.
*   **Maps**: For map functionalities, use `mapbox-gl` and `react-map-gl`.
*   **Charts**: For any data visualization requiring charts, use `recharts`.
*   **Toast Notifications**: Use `sonner` for all toast notifications to provide user feedback.
*   **Form Handling**: Use `react-hook-form` for form management and `zod` for schema validation.
*   **Date Utilities**: Use `date-fns` for any date manipulation or formatting.
*   **Utility Functions**: Place general utility functions in `src/lib/utils.ts`.
*   **File Structure**:
    *   Pages should reside in `src/pages/`.
    *   Reusable components should be placed in `src/components/`.
    *   Custom React hooks should be in `src/hooks/`.