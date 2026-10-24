import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { websiteJsonLd } from "../../components/JsonLd/JsonLd";
import { collections } from "../../data/collections";
import { collectionPath, gamePath, gamesPath, genrePath, platformsPath } from "../../seo/canonicalUrl";
import { SITE_NAME, SITE_ORIGIN } from "../../site";
import { genres as listedGenres } from "../../../scripts/publicLinks.mjs";
import ErrorState from "../../components/ui/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { whyOverrides } from "../../content/whyOverrides";
import { getUserCollection } from "../../services/collection/collectionService";
import { hydrateShelfTags } from "../../services/collection/hydrateShelf";
import { collectionKeys } from "../../services/collection/queryKeys";
import { fetchTonight } from "../../services/recommendations/fetchTonight";
import { markSeen, readSeen } from "../../services/recommendations/seenStore";
import { composeTonight, type Mood, type ReasonCode, type TonightGame, type TonightTime } from "../../services/recommendations/tonightScore";
import { track } from "../../services/analytics/track";
import { FAMILY_MODELS, gamesOnPlatform } from "../../services/platforms/deviceModel";
import { getAllSwipes } from "../../services/match/swipeStore";
import { useMyDevices } from "../../hooks/useMyDevices";
import BoardingPass from "./BoardingPass";
import styles from "./HomePage.module.scss";

const PLATFORMS: Record<string, number[]> = {
  pc: [4],
  ps: [187, 18],
  xbox: [186, 1],
  switch: [7],
  deck: [4],
};

const MOODS: Mood[] = ["calm", "deep", "finish", "coop"];
const TIMES: TonightTime[] = [30, 120, 300];
const PLATS = ["pc", "ps", "xbox", "switch", "deck"] as const;

const monthsOnShelf = (addedAt?: number) => Math.max(1, Math.round((Date.now() - (addedAt || Date.now())) / (1000 * 60 * 60 * 24 * 30)));

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hydrated = useRef(false);
  const deviceHydrated = useRef(false);
  const { deviceIds, save } = useMyDevices();
  const { data: collection = [] } = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });
  const [time, setTime] = useState<TonightTime>(120);
  const [plat, setPlat] = useState<(typeof PLATS)[number]>("pc");
  const [modelId, setModelId] = useState<number | null>(null);
  const [openPlatforms, setOpenPlatforms] = useState(false);
  const [mood, setMood] = useState<Mood>("finish");
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [seen, setSeen] = useState<number[]>(() => readSeen());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSeen(readSeen());
    setIndex(0);
    setExhausted(false);
  }, [mood, time, plat, openPlatforms]);

  useEffect(() => {
    if (!user || hydrated.current || collection.length === 0) return;
    hydrated.current = true;
    hydrateShelfTags(collection).then((count) => {
      if (count > 0) queryClient.invalidateQueries({ queryKey: collectionKeys.user(user.uid) });
    });
  }, [user, collection, queryClient]);

  useEffect(() => {
    if (deviceHydrated.current || deviceIds.length === 0) return;
    deviceHydrated.current = true;
    const id = deviceIds[0];
    if (id === 18 || id === 187) setPlat("ps");
    else if (id === 186 || id === 1) setPlat("xbox");
    else if (id === 7) setPlat("switch");
    else if (id === 4) setPlat("pc");
    setModelId(id);
  }, [deviceIds]);

  const models = FAMILY_MODELS[plat] ?? [];
  const concreteId = plat === "deck" || openPlatforms ? null : modelId ?? models[0]?.id ?? PLATFORMS[plat][0];
  const platforms = useMemo(() => (concreteId ? [concreteId] : []), [concreteId]);
  const exclude = collection.map((game) => game.id).slice(0, 200);

  const tonight = useQuery({
    queryKey: ["tonight", mood, time, platforms.join(","), exclude.join(","), seen.join(",")],
    queryFn: () => fetchTonight({ mood, time, platforms, exclude, seen }),
    staleTime: 10 * 60 * 1000,
  });

  const composed = useMemo(() => {
    const list = composeTonight(tonight.data?.results ?? [], collection, mood, time, platforms);
    if (!concreteId) return list;
    return { ...list, games: gamesOnPlatform(list.games, concreteId) };
  }, [tonight.data, collection, mood, time, platforms, concreteId]);
  const ticket = composed.games[index];
  const shelfGame = ticket ? collection.find((game) => game.id === ticket.id) : undefined;

  useEffect(() => {
    if (!ticket) return;
    markSeen(ticket.id);
    track("ticket_shown", {
      game_id: ticket.id,
      time,
      mood,
      platform_id: openPlatforms ? 0 : PLATFORMS[plat][0],
      source: composed.fromShelf ? "backlog" : "tonight",
    });
  }, [ticket, time, mood, plat, openPlatforms, composed.fromShelf]);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const late = hour < 6;
  const progress = late ? 1 : hour < 18 ? 0 : (hour * 60 + minute - 18 * 60) / (6 * 60);
  const leftMinutes = Math.max(0, 24 * 60 - (hour * 60 + minute));
  const clockNote = late ? t("landing.late") : hour < 18 ? t("landing.before") : t("landing.evening");

  const reasonText = (code: ReasonCode, game: TonightGame, months: number) => {
    const key = `tonight.reasons.${code.replace(/:/g, "_").replace(/-/g, "_")}`;
    return t(key, {
      min: Math.max(15, Math.round((game.playtime || 0.5) * 60)),
      h: game.playtime || 1,
      score: game.metacritic || game.rating,
      months,
      tag: (code.split(":")[1] || "").replace(/-/g, " "),
    });
  };

  const why = (game: TonightGame) => {
    const months = monthsOnShelf(collection.find((item) => item.id === game.id)?.addedAt);
    const lines: string[] = [];
    const override = whyOverrides[game.id];
    if (override) lines.push(i18n.language.startsWith("en") ? override.en : override.ru);
    for (const code of game.reasons) {
      if (lines.length >= 2) break;
      if (code === "shelf:age") continue;
      if (code === "time:evening" && !(game.playtime > 0 && game.playtime * 60 <= time)) {
        lines.push(t("landing.len_parts", { count: game.playtime || 1 }));
        continue;
      }
      lines.push(reasonText(code, game, months));
    }
    return lines.slice(0, 2);
  };

  const lengthLabel = (game: TonightGame) => {
    const fits = game.playtime > 0 && game.playtime * 60 <= time;
    if (fits && game.playtime <= 2) return t("landing.len_min", { count: Math.round(game.playtime * 60) });
    if (fits) return t("landing.len_short", { count: game.playtime });
    if (game.playtime > 0) return t("landing.len_parts", { count: game.playtime });
    return t("landing.len_parts", { count: 0 });
  };

  const next = () => {
    if (ticket) track("ticket_next", { game_id: ticket.id });
    if (index + 1 >= composed.games.length) {
      setExhausted(true);
      return;
    }
    setIndex((value) => value + 1);
  };

  const widen = () => {
    if (ticket) track("ticket_widen", { game_id: ticket.id });
    setTime(300);
    setOpenPlatforms(true);
    setExhausted(false);
  };

  const copyTicket = async () => {
    if (!ticket) return;
    track("ticket_copy", { game_id: ticket.id });
    const text = [ticket.name, ...why(ticket), `${SITE_NAME} · ${SITE_ORIGIN}/`].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const lines = ticket ? why(ticket) : [];
  const months = monthsOnShelf(shelfGame?.addedAt);
  const more = composed.games.slice(index + 1, index + 6);

  return (
    <div className={styles.page} data-seo-ready="true">
      <PageMeta title={t("landing.title")} description={t("landing.meta")} exactTitle />
      <JsonLd data={websiteJsonLd()} />
      <div className={styles.evening}>
        <span className={styles.clock}>{clock}</span>
        <div className={styles.line} aria-hidden="true">
          <i className={styles.fill} style={{ width: `${Math.round(progress * 100)}%` }} />
          <i className={styles.now} style={{ left: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className={styles.labels}>
          <span>18:00</span>
          <span>{clockNote}</span>
          <span>00:00</span>
        </div>
        {hour >= 18 && !late ? (
          <p className={styles.left}>{t("landing.left", { hours: Math.floor(leftMinutes / 60), minutes: leftMinutes % 60 })}</p>
        ) : null}
      </div>

      <div className={styles.head}>
        <h1 className={styles.title}>
          <span className={styles.q}>{t("landing.question")}</span>
          {ticket ? <span className={styles.a}>{`${ticket.name}.`}</span> : null}
        </h1>
      </div>

      <div className={styles.row}>
        <span className={styles.key}>{t("landing.time")}</span>
        <div className={styles.opts}>
          {TIMES.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.opt}
              aria-pressed={time === value}
              onClick={() => {
                setTime(value);
                track("ticket_time_select", { value });
              }}
            >
              {t(`landing.time_${value}`)}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <span className={styles.key}>{t("landing.platform")}</span>
        <div className={styles.opts}>
          {PLATS.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.opt}
              aria-pressed={!openPlatforms && plat === value}
              onClick={() => {
                setOpenPlatforms(false);
                setPlat(value);
                const next = FAMILY_MODELS[value]?.[0]?.id ?? (value === "deck" ? null : PLATFORMS[value][0]);
                setModelId(next);
                if (next) {
                  track("ticket_platform_select", { platform_id: next });
                  void save([{ id: next, name: t(`landing.plat_${value}`) }]);
                }
              }}
            >
              {t(`landing.plat_${value}`)}
            </button>
          ))}
        </div>
      </div>
      {models.length > 1 && (
        <div className={styles.row}>
          <span className={styles.key}>{t("landing.platform")}</span>
          <div className={styles.opts}>
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                className={styles.opt}
                aria-pressed={concreteId === model.id}
                onClick={() => {
                  setModelId(model.id);
                  track("ticket_platform_select", { platform_id: model.id });
                  void save([{ id: model.id, name: t(`landing.model_${model.key}`) }]);
                }}
              >
                {t(`landing.model_${model.key}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      {plat === "deck" && <p className={styles.rules}>{t("landing.deck_check")}</p>}
      {(collection.length > 0 || getAllSwipes().some((swipe) => swipe.action === "like")) && (
        <p className={styles.rules}>
          <Link to="/me">{t("landing.more_for_you")}</Link>
        </p>
      )}
      <div className={styles.row}>
        <span className={styles.key}>{t("landing.mood")}</span>
        <div className={styles.opts}>
          {MOODS.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.opt}
              aria-pressed={mood === value}
              onClick={() => {
                setMood(value);
                track("ticket_mood_select", { value });
              }}
            >
              {t(`landing.mood_${value}`)}
            </button>
          ))}
        </div>
      </div>

      {tonight.isError ? (
        <ErrorState onRetry={() => tonight.refetch()} />
      ) : tonight.isLoading ? (
        <BoardingPass />
      ) : !ticket ? (
        <p className={styles.rules}>{t("landing.empty_why")}</p>
      ) : (
        <div className={styles.wrap}>
          <article className={styles.ticket}>
            <header className={styles.headRow}>
              <span>{t("landing.ticket")}</span>
              <span>
                {composed.fromShelf && shelfGame
                  ? `${t("landing.from_shelf")} · ${t("landing.shelf_age", { count: months })}`
                  : composed.shelfMiss
                    ? t("tonight.shelf_miss")
                    : t("landing.seat")}
              </span>
            </header>
            <h2 className={styles.game}>{ticket.name}</h2>
            <p className={styles.meta}>
              <span>{lengthLabel(ticket)}</span>
              <span>{openPlatforms ? t("landing.platform") : t(`landing.plat_${plat}`)}</span>
              <span>{t(`landing.mood_${mood}`)}</span>
            </p>
            <p className={styles.why}>
              <span className={styles.whyLabel}>{t("landing.why")}</span>
              {lines[0]}
              {lines[1] ? <> {lines[1]}</> : null}
            </p>
            <footer className={styles.foot}>
              <span>{t("landing.rawg", { value: ticket.rating ? ticket.rating.toFixed(1) : "—" })}</span>
              <span className={styles.barcode} aria-hidden="true" />
            </footer>
          </article>
          <div className={styles.side}>
            <Link
              className={styles.go}
              to={gamePath(ticket.id)}
              onClick={() => track("game_open", { game_id: ticket.id, from: "ticket" })}
            >
              {t("landing.take")}
              <span>{t("landing.open")}</span>
            </Link>
            {exhausted ? (
              <button type="button" className={styles.alt} onClick={widen}>
                {t("tonight.widen")}
              </button>
            ) : (
              <button type="button" className={styles.alt} onClick={next}>
                {t("landing.another")}
              </button>
            )}
            <button type="button" className={styles.alt} onClick={copyTicket}>
              {copied ? t("landing.copied") : t("landing.copy")}
            </button>
            {exhausted ? <p className={styles.rules}>{t("tonight.thats_all")}</p> : null}
          </div>
        </div>
      )}

      {more.length > 0 ? (
        <section className={styles.more}>
          <h2 className={styles.moreTitle}>{t("landing.more")}</h2>
          <div className={styles.moreRow}>
            {more.map((game) => (
              <Link
                key={game.id}
                to={gamePath(game.id)}
                className={styles.moreCard}
                onClick={() => track("game_open", { game_id: game.id, from: "ticket" })}
              >
                <span>{game.name}</span>
                <span>{lengthLabel(game)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.about}>
        <h2 className={styles.moreTitle}>{t("common.catalog")}</h2>
        <div className={styles.paths}>
          <Link to={gamesPath()}>{t("common.games")}</Link>
          <Link to={platformsPath()}>{t("common.platforms")}</Link>
          {listedGenres.map((genre) => (
            <Link key={genre.slug} to={genrePath(genre.slug)}>
              {i18n.language.startsWith("en") ? genre.en : genre.ru}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.about}>
        <p>{t("landing.about_1")}</p>
        <p>{t("landing.about_2")}</p>
        <p>{t("landing.about_3")}</p>
        <p className={styles.paths}>
          <Link to={gamesPath()}>{t("common.catalog")}</Link>
          <Link to="/match">{t("common.game_match")}</Link>
          <Link to="/search">{t("common.find_game")}</Link>
        </p>
      </section>

      <section className={styles.about}>
        <h2 className={styles.moreTitle}>{t("landing.picks")}</h2>
        <div className={styles.paths}>
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              to={collectionPath(collection.slug)}
              onClick={() => track("collection_open", { slug: collection.slug, from: "home" })}
            >
              {i18n.language.startsWith("en") ? collection.title.en : collection.title.ru}
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.rules}>{t("landing.rules")}</p>
    </div>
  );
};

export default HomePage;
