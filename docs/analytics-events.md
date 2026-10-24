# События Gamevening

События уходят в GA4 через `gtag("event", name, params)`. `user_id` не передаётся. Если `gtag` ещё не загрузился, вызов ничего не делает и не пишет ошибку.

Ключи `ticket_shown`, `store_click` и `collection_add` отмечаются вручную в GA4 Admin, свойство `properties/542094991`.

## Воронка

`page_view` на `/` → выбор времени, платформы и настроения на билете → `ticket_shown` → `game_open` с `from=ticket` → `store_click`.

## События

| Событие | Когда | Параметры |
| --- | --- | --- |
| `page_view` | Смена адреса | `page_path`, `page_location`, `page_title` |
| `ticket_time_select` | Выбор времени на билете | `value` |
| `ticket_platform_select` | Выбор платформы на билете | `platform_id` |
| `ticket_mood_select` | Выбор настроения на билете | `value` |
| `ticket_shown` | Показан результат билета | `game_id`, `time`, `mood`, `platform_id`, `source` (`tonight` или `backlog`) |
| `ticket_next` | Другая игра на билете | `game_id` |
| `ticket_widen` | Расширение условий билета | `game_id` |
| `ticket_copy` | Копирование билета | `game_id` |
| `game_open` | Переход на страницу игры | `game_id`, `from` (`ticket`, `collection:<slug>`, `catalog`, `genre:<slug>`) |
| `store_click` | Ссылка CheapShark или официального магазина | `game_id`, `store` |
| `collection_open` | Открытие подборки | `slug`, `from` (`home`, `games`, `other`) |
| `collection_add` | Игра добавлена на полку или взята из беклога | `game_id`, `status` |
