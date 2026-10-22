export interface LocalizedText {
  ru: string;
  en: string;
}

export interface CollectionGame {
  id: number;
  name: string;
  fit: LocalizedText;
  session: LocalizedText;
  evening: LocalizedText;
  platforms: LocalizedText;
  why: LocalizedText;
  notFor: LocalizedText;
}

export interface EditorialCollection {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  intro: LocalizedText;
  source: LocalizedText;
  checked: LocalizedText;
  games: CollectionGame[];
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const source = text(
  "Названия, обложки и оценки сообщества берутся из RAWG. Время сессии — редакционная оценка PlayHub, не поле playtime из RAWG.",
  "Names, covers, and community scores come from RAWG. Session length is a PlayHub editorial estimate, not the RAWG playtime field.",
);

const checked = text("Проверено 21 октября 2026.", "Checked on 21 October 2026.");

const game = (
  id: number,
  name: string,
  fit: LocalizedText,
  session: LocalizedText,
  evening: LocalizedText,
  platforms: LocalizedText,
  why: LocalizedText,
  notFor: LocalizedText,
): CollectionGame => ({ id, name, fit, session, evening, platforms, why, notFor });

const pc = text("ПК.", "PC.");
const pcLocal = text("ПК, локально вдвоём на одном компьютере.", "PC, locally for two people on one computer.");

export const collections: EditorialCollection[] = [
  {
    slug: "coop-pc",
    title: text("Во что поиграть вдвоём на ПК", "What to play together on PC"),
    description: text(
      "Три игры, где второй человек нужен по правилам: It Takes Two, Overcooked 2 и Stardew Valley.",
      "Three games where a second person is required: It Takes Two, Overcooked 2, and Stardew Valley.",
    ),
    intro: text(
      "Эта подборка для вечера, когда рядом второй человек и один компьютер. В каталоге тысячи игр с пометкой кооп, но большинство спокойно проходятся в одиночку, а второй игрок там только мешает. Сюда попали игры, где компания — правило, а не галочка в настройках. Мы смотрели на две вещи: можно ли начать без долгого обучения и можно ли остановиться, не потеряв прогресс. Отдельная приставка не нужна. Достаточно одного ПК, двух человек и пары часов. Это не рейтинг всех кооп-игр интернета и не список, собранный из чужих топов. Каждая игра ниже уже есть в нашем каталоге, и у каждой своя причина лежать именно здесь. Если после них захочется ещё, откройте каталог и ищите кооп сами. На этот вечер трёх честных вариантов хватает, чтобы не листать витрину до полуночи и не спорить, какую игру ставить, пока время уже ушло. Берите ту, которая совпадает с настроением пары: история, суета или тихий общий день. Все три стоят на ПК.",
      "This list is for an evening with a second person and one computer. Plenty of games mention co-op, but you can finish most of them alone. These need the other person. One PC is enough, and you can stop without losing the evening.",
    ),
    source,
    checked,
    games: [
      game(
        455597,
        "It Takes Two",
        text("Паре, которая хочет общую историю на одном компьютере.", "A pair who want a shared story on one computer."),
        text("Одна глава. Сессию удобно закончить на её границе.", "One chapter. A chapter break is a clean place to stop."),
        text("Всю игру за вечер нет. Одну главу — да.", "The whole game does not fit one evening. One chapter does."),
        pcLocal,
        text(
          "В одиночку не запускается. Каждая глава меняет способ играть вместе, и сессию удобно закончить на границе главы.",
          "It does not start for one player. Each chapter changes how you play together, and a chapter break is a clean place to stop.",
        ),
        text("Тому, кто играет один.", "Anyone playing alone."),
      ),
      game(
        58827,
        "Overcooked! 2",
        text("Паре, которой нужна короткая суета, а не история.", "A pair who want a short scramble, not a story."),
        text("Около получаса, один уровень.", "About half an hour, one level."),
        text("Один уровень закрывается за вечер. Вся игра — нет.", "One level fits an evening. The whole game does not."),
        pcLocal,
        text(
          "Полчаса на кухне. Либо вы договариваетесь на ходу, либо заказ сгорает. Коротко и сразу вдвоём.",
          "Half an hour in a kitchen. You either agree on the fly or the order burns. Short, and immediately for two.",
        ),
        text("Тому, кто хочет тихий вечер без спешки.", "Anyone who wants a quiet evening without a rush."),
      ),
      game(
        654,
        "Stardew Valley",
        text("Паре, которой нужен тихий общий день.", "A pair who want a quiet shared day."),
        text("Один игровой день короткий. Выйти можно в любой вечер.", "One in-game day is short. You can leave any evening."),
        text("Ферму целиком за вечер не закрыть. Один день — да, прогресс остаётся.", "The whole farm does not close in one evening. One day does, and the progress stays."),
        text("ПК, одна ферма на двоих, локально на одном компьютере.", "PC, one farm for two, locally on one computer."),
        text(
          "Одна ферма на двоих. Игровой день короткий, выйти можно в любой вечер, прогресс никуда не денется.",
          "One farm for two. A day is short, you can leave any evening, and the progress stays.",
        ),
        text("Тому, кто хочет закончить игру сегодня или играет один.", "Anyone who wants to finish the game today, or who is playing alone."),
      ),
    ],
  },
  {
    slug: "short-evening",
    title: text("Короткие игры на вечер", "Short games for an evening"),
    description: text(
      "Игры, которые честно помещаются в один вечер: A Short Hike, Into the Breach, Unpacking, Dorfromantik и Overcooked 2.",
      "Games that honestly fit one evening: A Short Hike, Into the Breach, Unpacking, Dorfromantik, and Overcooked 2.",
    ),
    intro: text(
      "Короткая игра — не та, у которой в магазине написано «десять часов», а та, которую можно закрыть до сна и не оставлять висеть в полке на месяц. В этот список попали вещи с понятным концом или с партией, которая сама заканчивается. Здесь нет открытых миров, где «ещё один квест» съедает ночь. A Short Hike проходит целиком. Into the Breach даёт одну понятную партию. Unpacking и Dorfromantik можно отложить на ровной точке, но и за вечер в них есть цельный кусок. Overcooked 2 заканчивается вместе с уровнем. Мы брали игры, которые уже разбирали для вечернего билета, и оставили только те, где время не врёт. Если вечер длиннее, чем казалось, берите следующую из списка, а не новую вкладку каталога. Список нарочно маленький: пять названий, которые не спорят друг с другом за одно и то же настроение и не требуют отдельного вечера на обучение. Одного пункта отсюда хватает на сегодня, без хвоста на следующую неделю.",
      "A short game is one you can finish before sleep, not one whose store page says ten hours. These either end, or a single match ends. No open world where one more quest eats the night.",
    ),
    source,
    checked,
    games: [
      game(
        304247,
        "A Short Hike",
        text("Тому, кто хочет закрыть игру до сна, без гринда.", "Anyone who wants to finish a game before sleep, with no grind."),
        text("Весь путь к вершине.", "The whole walk to the summit."),
        text("Да, целиком. Это полное прохождение, а не кусок длинной игры.", "Yes, the whole game. This is a full playthrough, not a slice of a long game."),
        pc,
        text("Целиком за один вечер. Идёшь к вершине и разговариваешь с птицами, без давления и без гринда.", "The whole game fits one evening. You walk to the summit and talk to birds, with no grind."),
        text("Тому, кто ищет длинный открытый мир.", "Anyone looking for a long open world."),
      ),
      game(
        13566,
        "Into the Breach",
        text("Тому, кто хочет одну понятную партию.", "Anyone who wants one clear match."),
        text("Около получаса.", "About half an hour."),
        text("Одна партия — да. Вся кампания за вечер не обещается.", "One match, yes. The whole campaign is not promised for one evening."),
        pc,
        text("Одна партия — около получаса. Проигрыш не обижает, а думать приятно.", "One match is about half an hour. Losing does not sting, and the thinking feels good."),
        text("Тому, кто хочет пройти сюжет от начала до титров за сегодня.", "Anyone who wants the story from the start to the credits tonight."),
      ),
      game(
        364942,
        "Unpacking",
        text("Тому, кто раскладывает вещи без таймера.", "Anyone who wants to sort things with no timer."),
        text("Одна комната.", "One room."),
        text("Комнату можно закрыть за вечер. Игру можно отложить на границе комнаты.", "A room can close in one evening. You can stop at a room boundary."),
        pc,
        text("Раскладываешь коробки и узнаёшь чужую жизнь. Таймера нет, вечер заканчивается вместе с комнатой.", "You unpack boxes and piece together a life. There is no timer, and a room is a clean ending."),
        text("Тому, кто хочет бои, очки или открытый мир.", "Anyone who wants combat, a score, or an open world."),
      ),
      game(
        568931,
        "Dorfromantik",
        text("Тому, кто кладёт плитки, пока не кончится желание.", "Anyone who wants to place tiles until the mood runs out."),
        text("Пока не кончится колода или настроение. Сессия сама себя ограничивает.", "Until the stack or the mood runs out. The session limits itself."),
        text("Цельный кусок за вечер есть. Полное прохождение не требуется: врагов нет.", "There is a complete piece for one evening. A full playthrough is not required: there are no enemies."),
        pc,
        text("Кладёшь плитки, пока не кончится колода или желание. Врагов нет, сессия сама себя ограничивает.", "You place tiles until the stack or the mood runs out. No enemies, and the session limits itself."),
        text("Тому, кто хочет сюжет с концом или противника.", "Anyone who wants a story with an ending, or an opponent."),
      ),
      game(
        58827,
        "Overcooked! 2",
        text("Тому, кому вечером нужна одна короткая смена.", "Anyone who wants one short shift tonight."),
        text("Один уровень. Уровень заканчивается сам.", "One level. A level ends on its own."),
        text("Один ресторан — да. Вся игра — нет.", "One restaurant, yes. The whole game, no."),
        pc,
        text("Уровень заканчивается сам. Если вечер уже поздний, хватает одного ресторана.", "A level ends on its own. If the evening is already late, one restaurant is enough."),
        text("Тому, кто хочет пройти игру целиком сегодня.", "Anyone who wants to finish the whole game tonight."),
      ),
    ],
  },
  {
    slug: "relax",
    title: text("Спокойные игры после работы", "Calm games after work"),
    description: text(
      "Без таймера и без вины: Unpacking, Dorfromantik, Stardew Valley и A Short Hike.",
      "No timer and no guilt: Unpacking, Dorfromantik, Stardew Valley, and A Short Hike.",
    ),
    intro: text(
      "После работы не всегда нужна ещё одна система, в которой надо побеждать. Эта подборка собрана из игр, где нет врага, которого стыдно не убить, и нет таймера, который орёт, что вы медленные. Сюда не попали «расслабляющие» шутеры и рогалики со словом cozy на обложке. Unpacking просит разложить вещи. Dorfromantik просит положить плитку к плитке. Stardew Valley даёт короткий день и не наказывает, если вы просто полили грядки. A Short Hike короткая прогулка без списка дел на сорок пунктов. Принцип отбора простой: игру можно поставить на паузу в любую минуту, и завтра не придётся вспоминать, на каком боссе вы остановились. Если хочется напряжения, это не та страница. Если хочется выдохнуть и всё же поиграть, начните с любой из четырёх. Они не спорят за внимание и не требуют, чтобы вы были в форме. Завтра можно вернуться к той же игре с того же места, без вчерашнего долга, без спешки и без чувства, что вы кому-то должны сессию.",
      "After work you do not always need another system to beat. These have no enemy you feel guilty for ignoring and no timer shouting that you are slow. You can pause any minute.",
    ),
    source,
    checked,
    games: [
      game(
        364942,
        "Unpacking",
        text("После работы, когда хочется занять руки и не побеждать.", "After work, when you want your hands busy and nothing to beat."),
        text("Одна комната. Таймера нет.", "One room. There is no timer."),
        text("Комнату можно закончить. Поражения нет, остановиться можно в любую минуту.", "A room can finish. There is no defeat, and you can stop any minute."),
        pc,
        text("Руки заняты коробками, голова отдыхает. Ни очков, ни поражения.", "Your hands sort boxes and your head rests. No score and no defeat."),
        text("Тому, кто хочет напряжение, очки или босса.", "Anyone who wants pressure, a score, or a boss."),
      ),
      game(
        568931,
        "Dorfromantik",
        text("После работы, когда ошибка не должна портить вечер.", "After work, when a mistake should not spoil the evening."),
        text("Пока кладёте плитки. Таймера нет.", "While you place tiles. There is no timer."),
        text("Проиграть вечер нельзя. Остановиться можно в любую минуту, босса нет.", "You cannot lose the evening. You can stop any minute, and there is no boss."),
        pc,
        text("Деревня растёт, пока вы кладёте плитки. Ошибиться можно, проиграть вечер нельзя.", "A village grows as you place tiles. You can misplace one, but you cannot lose the evening."),
        text("Тому, кто ищет врага или соревнование.", "Anyone looking for an enemy or a contest."),
      ),
      game(
        654,
        "Stardew Valley",
        text("После работы, когда хватает сил на грядки, а не на босса.", "After work, when you have energy for crops, not a boss."),
        text("Один день в игре — четверть часа. Таймера на вечер нет.", "One in-game day is fifteen minutes. There is no timer on the evening."),
        text("День закрывается. Игру целиком — нет. Выйти можно без чувства долга.", "A day closes. The whole game does not. You can leave without owing the game anything."),
        pc,
        text("Один день в игре — четверть часа. Можно полить грядки и выйти без чувства долга.", "One in-game day is fifteen minutes. Water the crops and leave without owing the game anything."),
        text("Тому, кто хочет напряжение или закрыть ферму за один вечер.", "Anyone who wants pressure, or to finish the farm in one evening."),
      ),
      game(
        304247,
        "A Short Hike",
        text("Когда сил хватает только на малое.", "When you only have energy for something small."),
        text("Короткая прогулка. Таймера и списка дел нет.", "A short walk. There is no timer and no task list."),
        text("Да. Пауза в любую минуту, босса запоминать не нужно.", "Yes. You can pause any minute, and there is no boss to remember."),
        pc,
        text("Прогулка, а не список задач. Если сил хватает только на малое, это как раз малое.", "A walk, not a task list. If you only have energy for something small, this is small."),
        text("Тому, кто хочет большую игру или соревнование.", "Anyone who wants a large game or a contest."),
      ),
    ],
  },
  {
    slug: "like-hades",
    title: text("Игры, похожие на Hades", "Games like Hades"),
    description: text(
      "Короткие забеги, где смерть — не конец вечера: Hades, Slay the Spire и Into the Breach.",
      "Short runs where a loss is not the end of the evening: Hades, Slay the Spire, and Into the Breach.",
    ),
    intro: text(
      "Hades любят не за мифологию саму по себе, а за то, что один забег длится около часа и смерть не обнуляет вечер. Похожими мы считаем игры с тем же устройством времени: сел, прошёл попытку, встал. Не обязательно тот же жанр и не обязательно греческие боги. Slay the Spire тоже строится из коротких подъёмов, только руки почти не нужны, думает голова. Into the Breach ещё короче: партия на полчаса, поле маленькое, цена ошибки видна сразу. Сам Hades в списке есть, потому что подборка отвечает на запрос «хочу ещё такого», и первая честная рекомендация — доиграть или начать его, если он всё ещё лежит. Мы не добавляли игры только из-за слова roguelike на странице магазина. Если забег нельзя закончить за вечер или смерть ощущается как потерянное сохранение, её здесь нет. Три названия — это весь список, и каждое можно поставить вместо Hades, когда хочется того же ритма, а не той же истории.",
      "People like Hades because a run is about an hour and a death does not erase the evening. These share that shape of time: sit down, finish an attempt, stand up. The myth is optional.",
    ),
    source,
    checked,
    games: [
      game(
        274755,
        "Hades",
        text("Тому, кто хочет забег около часа, где смерть не обнуляет вечер.", "Anyone who wants a run of about an hour, where a death does not erase the evening."),
        text("Один забег — около часа. Это боёвка, попытка за попыткой.", "One run is about an hour. It is combat, attempt after attempt."),
        text("Один забег — да. Всю игру за вечер — нет. После смерти можно остановиться и ничего не потерять.", "One run, yes. The whole game in one evening, no. You can stop after a death and lose nothing."),
        pc,
        text("Один забег — около часа. Можно остановиться после смерти и ничего не потерять.", "One run is about an hour. You can stop after a death and lose nothing."),
        text("Тому, кто хочет одну непрерывную историю без повторных попыток.", "Anyone who wants one continuous story without repeated attempts."),
      ),
      game(
        28121,
        "Slay the Spire",
        text("Тому, кто хочет ритм попыток Hades, но колоду, а не боёвку.", "Anyone who wants Hades' rhythm of attempts, but a deck rather than combat."),
        text("Подъём занимает минут сорок. Руки почти не нужны, думает голова.", "A climb takes about forty minutes. Your hands barely matter; your head does the work."),
        text("Одну попытку — да. Всю игру — нет. Смерть начинает следующую попытку, а не стирает вечер.", "One attempt, yes. The whole game, no. A loss starts the next attempt instead of erasing the evening."),
        pc,
        text("Тот же ритм попыток, только это колода, а не боёвка. Подъём занимает минут сорок.", "The same rhythm of attempts, but it is a deck, not a fight. A climb takes about forty minutes."),
        text("Тому, кто хочет ту же боёвку и ту же историю, а не карты.", "Anyone who wants the same combat and the same story, not cards."),
      ),
      game(
        13566,
        "Into the Breach",
        text("Тому, кто хочет короче Hades: ошибся, увидел почему, начал следующую карту.", "Anyone who wants something shorter than Hades: you see why you failed, then start the next map."),
        text("Около получаса. Поле маленькое, цена ошибки видна сразу.", "About half an hour. The board is small, and the cost of a mistake is immediate."),
        text("Одну партию — да. Это не часовой экшен-забег.", "One match, yes. This is not an hour-long action run."),
        pc,
        text("Ещё короче Hades и так же честно: ошибся, увидел почему, начал следующую карту.", "Shorter than Hades and just as clear: you see why you failed, then start the next map."),
        text("Тому, кто хочет часовой экшен, как в Hades.", "Anyone who wants an hour of action, as in Hades."),
      ),
    ],
  },
  {
    slug: "story-driven",
    title: text("Игры с сильным сюжетом", "Story-driven games"),
    description: text(
      "Истории, ради которых садятся на вечер: Disco Elysium, Outer Wilds, Return of the Obra Dinn, Hollow Knight и Celeste.",
      "Stories worth an evening: Disco Elysium, Outer Wilds, Return of the Obra Dinn, Hollow Knight, and Celeste.",
    ),
    intro: text(
      "Сильный сюжет здесь — не ролик на двадцать минут между драками, а причина не выключать игру. В список попали пять разных способов рассказывать. Disco Elysium почти целиком состоит из текста, и вечер уходит в разговоры. Outer Wilds прячет историю в месте, которое вы узнаёте за двадцать две минуты цикла. Return of the Obra Dinn просит самого собрать, кто умер и почему. Hollow Knight говорит мало, но мир держит, если хочется большой игры, а не новеллы. Celeste короче и злее: история про подъём, который не получается с первого раза. Мы не ставили игры только потому, что у них высокий балл на RAWG. У каждой есть понятный повод сесть именно сегодня: либо история закрывается за пару вечеров, либо один кусок уже цельный. Если нужен боевик с катсценами, откройте каталог. Эта страница для тех, кто выбирает игру из-за того, что в ней происходит, а не из-за того, сколько в ней систем. Пять историй не похожи друг на друга, и этого достаточно для выбора.",
      "A strong story here is a reason to keep the game on, not a twenty-minute clip between fights. These five tell stories in different ways, and each one is a reason to sit down today.",
    ),
    source,
    checked,
    games: [
      game(
        262382,
        "Disco Elysium",
        text("Тому, кто выбирает игру из-за разговоров, а не из-за карты.", "Anyone who picks a game for the conversation, not the map."),
        text("Около трёх часов текста за вечер.", "About three hours of writing in an evening."),
        text("Цельный кусок разговоров — да. Всю историю за один вечер — нет.", "A complete stretch of conversation, yes. The whole story in one evening, no."),
        pc,
        text("Почти весь вечер — текст. Три часа проходят незаметно, если любите разговоры, а не карту.", "Most of the evening is writing. Three hours disappear if you like conversation more than a map."),
        text("Тому, кто хочет боевик с катсценами или игру, где мало читать.", "Anyone who wants a cutscene action game, or a game with little reading."),
      ),
      game(
        58764,
        "Outer Wilds",
        text("Тому, кто собирает историю из коротких циклов, а не из роликов.", "Anyone who wants a story built from short loops, not from cutscenes."),
        text("Один цикл — двадцать две минуты.", "One loop is twenty-two minutes."),
        text("Один цикл — да. История собирается из нескольких циклов.", "One loop, yes. The story is built from several loops."),
        pc,
        text("Один цикл — двадцать две минуты, но история собирается из них. Остановиться труднее, чем начать.", "One loop is twenty-two minutes, and the story is built from those loops. Stopping is the hard part."),
        text("Тому, кто хочет линейный сюжет с катсценами.", "Anyone who wants a linear story told in cutscenes."),
      ),
      game(
        46508,
        "Return of the Obra Dinn",
        text("Тому, кто сам собирает, что произошло.", "Anyone who wants to decide what happened."),
        text("Разбор имён и одной книги.", "Working through the names and one book."),
        text("Дело закрывается за пару вечеров, не обязательно за один.", "The case closes in a couple of evenings, not necessarily in one."),
        pc,
        text("Шестьдесят имён и одна книга. Вы сами решаете, что произошло, и закрываете дело за пару вечеров.", "Sixty names and one book. You decide what happened, and the case closes in a couple of evenings."),
        text("Тому, кто хочет, чтобы сюжет рассказали роликом.", "Anyone who wants the plot told in a cutscene."),
      ),
      game(
        9767,
        "Hollow Knight",
        text("Тому, кто хочет большую игру, а не новеллу. Сюжет тихий.", "Anyone who wants a large game rather than a short story. The plot is quiet."),
        text("Один заход в мир. Это большая игра, сессия не обещает конец.", "One visit to the world. This is a large game, and a session does not promise the ending."),
        text("За вечер не закрывается. Конец существует, но это не короткая история.", "It does not close in one evening. It does end, but it is not a short story."),
        pc,
        text("Если хочется большую игру, а не новеллу. Красиво, тихо, и конец существует.", "If you want a large game rather than a short story. Quiet, beautiful, and it does end."),
        text("Тому, кто хочет новеллу на вечер или боевик с катсценами. В список она попала не из-за балла RAWG.", "Anyone who wants a one-evening story or a cutscene action game. It is not here because of a RAWG score."),
      ),
      game(
        22121,
        "Celeste",
        text("Тому, кто хочет историю про подъём, который не выходит сразу.", "Anyone who wants a story about a climb that does not work the first time."),
        text("Один подъём. Сюжет короткий.", "One stretch of the climb. The story is short."),
        text("С первого раза подъём не выходит. Один вечер даёт честный кусок прогресса, не обязательно титры.", "The climb does not work the first time. One evening gives a fair piece of progress, not necessarily the credits."),
        pc,
        text("Подъём, который не выходит сразу. Сюжет короткий, а ощущение прогресса честное.", "A climb that does not work the first time. The story is short, and the progress feels fair."),
        text("Тому, кто хочет длинную историю в тексте или игру без повторных попыток.", "Anyone who wants a long story in writing, or a game without repeated attempts."),
      ),
    ],
  },
];

export const collectionBySlug = (slug: string) => collections.find((collection) => collection.slug === slug);
