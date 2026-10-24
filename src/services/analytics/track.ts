export type EventParams = Record<string, string | number | boolean | undefined>;

type Gtag = (...args: unknown[]) => void;

export const track = (name: string, params: EventParams = {}) => {
  const gtag = (globalThis as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  gtag("event", name, clean);
};
