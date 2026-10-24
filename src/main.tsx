// FILE: src/main.tsx
import { StrictMode, useEffect, useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigationType } from "react-router-dom";
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
import { track } from "./services/analytics/track";

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    track("page_view", {
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
};

const scrollPositions = new Map<string, number>();
let applyingScroll = false;

const rememberScroll = (y: number) => {
  applyingScroll = true;
  window.scrollTo(0, y);
  requestAnimationFrame(() => {
    applyingScroll = false;
  });
};

const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    const save = () => {
      if (applyingScroll) return;
      scrollPositions.set(key, window.scrollY);
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [key]);

  useLayoutEffect(() => {
    return () => {
      if (!applyingScroll) scrollPositions.set(key, window.scrollY);
    };
  }, [key]);

  useLayoutEffect(() => {
    const pathChanged = pathnameRef.current !== pathname;
    pathnameRef.current = pathname;
    if (hash) return;
    if (navigationType === "POP") {
      rememberScroll(scrollPositions.get(key) ?? 0);
      return;
    }
    if (pathChanged) rememberScroll(0);
  }, [pathname, hash, key, navigationType]);

  useEffect(() => {
    if (navigationType !== "POP" || hash) return;
    const y = scrollPositions.get(key) ?? 0;
    if (y > 0 && window.scrollY < y && document.documentElement.scrollHeight > y) {
      rememberScroll(y);
    }
  }, [pathname, hash, key, navigationType]);

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
            <ScrollToTop />
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
