// FILE: src/main.tsx
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import "./assets/styles/main.scss";
import App from "./App.tsx";
import { SearchProvider } from "./context/SearchContext.tsx";
import { ComparisonProvider } from "./context/ComparisonContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.tsx";
import { migrateLegacyKeys } from "./services/storage/migrateLegacyKeys";

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

migrateLegacyKeys();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Analytics />
            <AuthProvider>
              <ComparisonProvider>
                <SearchProvider>
                  <App />
                  <Toaster position="top-center" />
                </SearchProvider>
              </ComparisonProvider>
            </AuthProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </I18nextProvider>
  </StrictMode>
);
