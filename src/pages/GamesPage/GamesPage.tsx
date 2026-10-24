// FILE: src/pages/GamesPage/GamesPage.tsx
import React, { useEffect, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchGames } from "../../services/games/fetchGames";
import { getGenres } from "../../services/games/getGenres";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import { collections } from "../../data/collections";
import { CATALOG_PAGE_SIZE, GENRE_PAGES, genres as listedGenres, platforms as listedPlatforms } from "../../../scripts/publicLinks.mjs";
import { collectionPath, gamePath, gamesPagePath, gamesPath, genrePagePath, genrePath, platformPath, platformsPath, canonicalUrl } from "../../seo/canonicalUrl";
import { track } from "../../services/analytics/track";
import { SITE_ORIGIN } from "../../site";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameFilters from "./components/GameFilters/GameFilters";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { breadcrumbJsonLd, itemListJsonLd } from "../../components/JsonLd/JsonLd";
import RawgCredit from "../../components/RawgCredit/RawgCredit";
import { RAWG_DETAIL_STALE_TIME, RAWG_LIST_STALE_TIME } from "../../services/rawgCache";
import type { Game } from "../../types/game";
import styles from "./GamesPage.module.scss";

const STORAGE_KEY = "gamevening:filters:v1";

export type SortKey =
  | "popular"
  | "rating"
  | "metacritic"
  | "released"
  | "new"
  | "name";

const ORDERING_MAP: Record<SortKey, string> = {
  popular: "-added",
  rating: "-rating",
  metacritic: "-metacritic",
  released: "-released",
  new: "-created",
  name: "name",
};

const GamesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { slug, page: pageParam } = useParams<{ slug?: string; page?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const english = i18n.language.startsWith("en");

  const filter = (searchParams.get("filter") as SortKey) || "popular";
  const pathPage = pageParam ? Number.parseInt(pageParam, 10) : Number.NaN;
  const currentPage = Number.isFinite(pathPage) && pathPage > 0 ? pathPage : parseInt(searchParams.get("page") || "1", 10);
  const selectedYear = searchParams.get("year") || "";
  const selectedYearTo = searchParams.get("yearTo") || "";
  const selectedGenreId = slug || searchParams.get("genre") || "";
  const selectedPlatformId = searchParams.get("platform") || "";
  const selectedDeveloperId = searchParams.get("developer") || "";
  const selectedTagId = searchParams.get("tag") || "";
  const selectedPlaytime = searchParams.get("playtime") || "";
  const selectedMetacritic = searchParams.get("metacritic") || "";
  const hasExtraFilter = !!(
    selectedYear ||
    selectedYearTo ||
    selectedPlatformId ||
    selectedDeveloperId ||
    selectedTagId ||
    selectedPlaytime ||
    selectedMetacritic ||
    filter !== "popular"
  );
  const plainCatalog = !slug && !hasExtraFilter;
  const plainGenre = !!slug && !hasExtraFilter;

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const list = await getPlatforms();
      return list.sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const catalogQuery = useQuery({
    queryKey: ["seo-catalog"],
    queryFn: async () => {
      const response = await fetch("/catalog.json");
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as { games: Game[] };
    },
    enabled: plainCatalog,
    retry: false,
    staleTime: Infinity,
  });

  const ordering = ORDERING_MAP[filter] ?? "-added";
  const useLiveList = !plainCatalog || (catalogQuery.isError && import.meta.env.DEV);

  const {
    data: gamesData,
    isLoading: liveLoading,
    isError: liveError,
    error,
  } = useQuery({
    queryKey: [
      "games",
      currentPage,
      ordering,
      selectedYear,
      selectedYearTo,
      selectedGenreId,
      selectedPlatformId,
      selectedDeveloperId,
      selectedTagId,
      selectedPlaytime,
      selectedMetacritic,
    ],
    queryFn: () =>
      fetchGames(
        currentPage,
        ordering,
        selectedYear,
        selectedGenreId,
        selectedPlatformId,
        selectedDeveloperId,
        selectedTagId,
        selectedPlaytime,
        selectedMetacritic,
        selectedYearTo,
      ),
    enabled: useLiveList,
    staleTime: RAWG_LIST_STALE_TIME,
  });

  const catalogGames = catalogQuery.data?.games ?? [];
  const catalogSlice = catalogGames.slice((currentPage - 1) * CATALOG_PAGE_SIZE, currentPage * CATALOG_PAGE_SIZE);
  const usingCatalog = plainCatalog && !!catalogQuery.data;
  const games = usingCatalog ? catalogSlice : gamesData?.games || [];
  const loading = plainCatalog && !catalogQuery.isError ? catalogQuery.isLoading : liveLoading;
  const isError = plainCatalog && !import.meta.env.DEV ? catalogQuery.isError : useLiveList ? liveError : false;
  const hasMore = usingCatalog
    ? currentPage * CATALOG_PAGE_SIZE < catalogGames.length
    : gamesData?.nextPageUrl != null && (!slug || currentPage < GENRE_PAGES);

  const basePath = slug ? genrePath(slug) : gamesPath();

  const updateParams = useCallback((newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value.toString());
      else params.delete(key);
    });
    const query = params.toString();
    navigate(`${basePath}${query ? `?${query}` : ""}`, { replace: true });
  }, [basePath, navigate, searchParams]);

  useEffect(() => {
    if (slug || pageParam) return;
    if (searchParams.toString() === "") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const newParams: Record<string, string> = {};
        if (parsed.year) newParams.year = parsed.year;
        if (parsed.yearTo) newParams.yearTo = parsed.yearTo;
        if (parsed.genre) newParams.genre = parsed.genre;
        if (parsed.platform) newParams.platform = parsed.platform;
        if (parsed.playtime) newParams.playtime = parsed.playtime;
        if (parsed.metacritic) newParams.metacritic = parsed.metacritic;
        if (Object.keys(newParams).length > 0) {
          setSearchParams(newParams);
        }
      }
    }
  }, [pageParam, slug, searchParams, setSearchParams]);

  useEffect(() => {
    if (slug) return;
    const filters = {
      year: selectedYear,
      yearTo: selectedYearTo,
      genre: selectedGenreId,
      platform: selectedPlatformId,
      playtime: selectedPlaytime,
      metacritic: selectedMetacritic,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [slug, selectedYear, selectedYearTo, selectedGenreId, selectedPlatformId, selectedPlaytime, selectedMetacritic]);

  const handleClearFilters = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate(basePath, { replace: true });
  };

  const pageHref = (page: number) => {
    if (plainCatalog) return gamesPagePath(page);
    if (plainGenre) return genrePagePath(slug, page);
    const params = new URLSearchParams(searchParams);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  const hasAnyFilter = !!(
    selectedYear ||
    selectedYearTo ||
    selectedGenreId ||
    selectedPlatformId ||
    selectedDeveloperId ||
    selectedTagId ||
    selectedPlaytime ||
    selectedMetacritic
  );

  const activeFilterCount =
    (selectedYear ? 1 : 0) +
    (selectedYearTo ? 1 : 0) +
    (selectedGenreId ? selectedGenreId.split(",").filter(Boolean).length : 0) +
    (selectedPlatformId ? 1 : 0) +
    (selectedDeveloperId ? 1 : 0) +
    (selectedTagId ? 1 : 0) +
    (selectedPlaytime ? 1 : 0) +
    (selectedMetacritic ? 1 : 0);

  const genreName = genres.find((genre) => genre.slug === selectedGenreId || String(genre.id) === selectedGenreId)?.name;
  const heading = slug && genreName ? genreName : t("common.games");
  const baseTitle = slug && genreName ? t("info.genre_title", { name: genreName }) : t("catalog.title");
  const baseDescription = slug && genreName ? t("info.genre_description", { name: genreName }) : t("catalog.description");
  const title = currentPage > 1 ? t("catalog.page_title", { title: baseTitle, page: currentPage }) : baseTitle;
  const description = currentPage > 1 ? t("catalog.page_description", { description: baseDescription, page: currentPage }) : baseDescription;
  const seoReady = !loading && !isError && games.length > 0 && (!slug || !!genreName);
  const resultCount = usingCatalog ? catalogGames.length : gamesData?.count;
  const resultPages = usingCatalog
    ? Math.ceil(catalogGames.length / CATALOG_PAGE_SIZE)
    : Math.max(1, Math.ceil((gamesData?.count || 0) / CATALOG_PAGE_SIZE));
  const visibleGenres = listedGenres.filter((genre) => genre.slug !== slug);

  return (
    <div className={styles.gamesPage} data-seo-ready={seoReady ? "true" : "false"}>
      <PageMeta title={title} description={description} />
      {slug && genreName && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: english ? "Home" : "Главная", url: `${SITE_ORIGIN}/` },
            { name: t("common.games"), url: canonicalUrl(SITE_ORIGIN, gamesPath()) },
            { name: genreName, url: canonicalUrl(SITE_ORIGIN, genrePath(slug)) },
          ])}
        />
      )}
      {games.length > 0 && <JsonLd data={itemListJsonLd(games)} />}
      <div className={styles.content}>
        {slug && (
          <nav className={styles.crumbs} aria-label="breadcrumb">
            <Link to="/">{english ? "Home" : "Главная"}</Link>
            <span aria-hidden="true">/</span>
            <Link to={gamesPath()}>{t("common.games")}</Link>
            <span aria-hidden="true">/</span>
            <span>{genreName || slug}</span>
          </nav>
        )}
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>{heading}</h1>
          {hasAnyFilter && (
            <button className={styles.clearButton} onClick={handleClearFilters}>
              {t("common.clear")}
            </button>
          )}
        </div>

        <GameFilters
          filter={filter}
          setFilter={(next) => updateParams({ filter: next, page: 1 })}
          selectedYear={selectedYear}
          setSelectedYear={(year) => updateParams({ year, page: 1 })}
          selectedYearTo={selectedYearTo}
          setSelectedYearTo={(year) => updateParams({ yearTo: year, page: 1 })}
          selectedGenreId={selectedGenreId}
          setSelectedGenreId={(genre) => updateParams({ genre, page: 1 })}
          selectedPlatformId={selectedPlatformId}
          setSelectedPlatformId={(platform) => updateParams({ platform, page: 1 })}
          selectedPlaytime={selectedPlaytime}
          setSelectedPlaytime={(range) => updateParams({ playtime: range, page: 1 })}
          selectedMetacritic={selectedMetacritic}
          setSelectedMetacritic={(score) => updateParams({ metacritic: score, page: 1 })}
          genres={genres}
          platforms={platforms}
          totalCount={resultCount}
          activeFilterCount={activeFilterCount}
        />

        {!slug && currentPage === 1 && (
          <nav className={styles.directory} aria-label={t("landing.picks")}>
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                to={collectionPath(collection.slug)}
                onClick={() => track("collection_open", { slug: collection.slug, from: "games" })}
              >
                {i18n.language.startsWith("en") ? collection.title.en : collection.title.ru}
              </Link>
            ))}
          </nav>
        )}

        {resultCount !== undefined && (
          <p className={styles.resultLine}>
            {t("collection.found_line", {
              count: resultCount.toLocaleString(i18n.language.startsWith("ru") ? "ru-RU" : "en-US"),
              page: currentPage,
              pages: resultPages,
            })}
          </p>
        )}

        <LoadingErrorMessage
          loading={loading && games.length === 0}
          error={isError ? (catalogQuery.error as Error)?.message || (error as Error)?.message || t("common.error") : null}
          noResults={!loading && !isError && games.length === 0}
        />

        {loading && games.length === 0 && (
          <div className={styles.gamesList}>
            {Array.from({ length: 12 }).map((_, index) => (
              <GameCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && !isError && games.length > 0 && (
          <div className={styles.gamesList}>
            {games.map((game) => (
              <Link
                key={game.id}
                to={selectedPlatformId ? `/game/${game.id}/${selectedPlatformId}` : gamePath(game.id)}
                className={styles.gameCardContainer}
                onClick={() => track("game_open", { game_id: game.id, from: slug ? `genre:${slug}` : "catalog" })}
              >
                <GameCard game={game} />
              </Link>
            ))}
          </div>
        )}
        {!loading && !isError && (currentPage > 1 || hasMore) && (
          <div className={styles.pagination}>
            {currentPage > 1 ? (
              <Link to={pageHref(currentPage - 1)} className={styles.paginationButton}>
                {t("catalog.filters.previous")}
              </Link>
            ) : (
              <span className={styles.paginationButton} aria-disabled="true">
                {t("catalog.filters.previous")}
              </span>
            )}
            <span className={styles.pageNumber}>{currentPage}</span>
            {hasMore && (
              <Link to={pageHref(currentPage + 1)} className={styles.paginationButton}>
                {t("catalog.filters.next")}
              </Link>
            )}
          </div>
        )}

        <section className={styles.directory}>
          <h2>{t("common.genres")}</h2>
          <nav aria-label={t("common.genres")}>
            <Link to={gamesPath()}>{t("catalog.all_games")}</Link>
            {visibleGenres.map((genre) => (
              <Link key={genre.slug} to={genrePath(genre.slug)}>
                {english ? genre.en : genre.ru}
              </Link>
            ))}
          </nav>
          <h2>{t("common.platforms")}</h2>
          <nav aria-label={t("common.platforms")}>
            <Link to={platformsPath()}>{t("common.platforms")}</Link>
            {listedPlatforms.map((platform) => (
              <Link key={platform.id} to={platformPath(platform.id)}>
                {platform.name}
              </Link>
            ))}
          </nav>
        </section>
        <RawgCredit />
      </div>
    </div>
  );
};

export default GamesPage;
