const DIRECTORY =
  /^\/(?:about|faq|games|platforms|collections\/[^/]+|genre\/[^/]+|platform\/[^/]+|game\/[^/]+|games\/page\/[^/]+|genre\/[^/]+\/page\/[^/]+)$/;

export const canonicalPathname = (pathname) => {
  const raw = (pathname || "/").split("?")[0].split("#")[0] || "/";
  if (raw === "/") return "/";
  const bare = raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
  if (DIRECTORY.test(bare)) return `${bare}/`;
  return raw;
};

export const absoluteUrl = (origin, pathname) =>
  `${String(origin).replace(/\/$/, "")}${canonicalPathname(pathname)}`;
