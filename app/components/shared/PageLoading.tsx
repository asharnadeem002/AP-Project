import React, { useEffect, useState } from "react";
import { Loader } from "./Loader";

type PageLoadingProps = {
  /**
   * Optional custom message to display while loading
   */
  message?: string;

  /**
   * Optional delay in ms before showing loader (prevents flashing for quick transitions)
   */
  delay?: number;
};

/**
 * PageLoading component for handling route transitions with optional delay
 */
export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Loading...",
  delay = 300,
}) => {
  const [shouldShow, setShouldShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;

    const timer = setTimeout(() => {
      setShouldShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldShow) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader size="xl" />
      {message && (
        <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Helper component for showing loader when transitioning between pages
 */
export const RouteChangeLoading: React.FC = () => {
  const [isRouteChanging, setIsRouteChanging] = useState(false);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsRouteChanging(true);
    };

    const handleRouteChangeComplete = () => {
      setIsRouteChanging(false);
    };

    // In Next.js Pages Router, you would use Router events
    // Example (comment out in App Router):
    // import { Router } from 'next/router'
    // Router.events.on('routeChangeStart', handleRouteChangeStart);
    // Router.events.on('routeChangeComplete', handleRouteChangeComplete);
    // Router.events.on('routeChangeError', handleRouteChangeComplete);

    // In Next.js App Router, you would use a different approach
    // Since this can vary based on implementation, we'll provide a
    // placeholder that can be customized

    return () => {
      // Router.events.off('routeChangeStart', handleRouteChangeStart);
      // Router.events.off('routeChangeComplete', handleRouteChangeComplete);
      // Router.events.off('routeChangeError', handleRouteChangeComplete);
    };
  }, []);

  if (!isRouteChanging) return null;

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Changing page...
        </p>
      </div>
    </div>
  );
};
