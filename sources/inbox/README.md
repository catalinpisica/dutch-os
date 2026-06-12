# Weekly Upload Inbox

Drop each week's note photos into the matching `YYYY-Www/images/` folder.

You do not need to rename the photos. Put each lesson's photos in the folder for that calendar week. During ingestion, Codex determines reading order using:

1. Original EXIF capture date and time, when present.
2. The device-generated filename as a secondary ordering signal.
3. File modification time as a final fallback.

If timestamps are missing, duplicated, or contradictory, Codex must report the ambiguity instead of silently guessing. Keep photos from different weeks in separate folders and take them in page order whenever possible.

Existing notes are organized under ISO weeks `2026-W15` through `2026-W22`.

Upload folders are prepared through `2026-W38`, covering lessons up to September 20, 2026. The next lesson on Monday, June 15 belongs in:

```text
sources/inbox/2026-W25/images/
```

If both weekly lessons produce notes, put all photos in the same week's folder. Take the photos in lesson and page order; Codex will normalize their names during ingestion.
