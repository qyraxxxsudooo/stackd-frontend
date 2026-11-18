# STAKED launch film

54 s, 9:16 (1080x1920, 24 fps). Hand-drawn ink on paper, lines boil 10x a second, orange is the only colour.
Everything is code: no generated images or video.

- `film.html`: the whole film (`renderAt(t)`); beat times in the `T` block at the top, voice beats in `VO`.
- `film-captions.html`: same film with captions (silent cut).
- `qr.json`: a real QR code of https://stackd-frontend.vercel.app.
- `sound/build_audio.py`: score (lo-fi groove in D, 96 bpm) + ~90 synthesized effects cued from `sound/events.json`; with a voice file it splits the lines on silences, places them on the `VO` beats and ducks the music.
- `fonts/`: Caveat (handwriting) and Inter (UI), both SIL OFL.
- Voice: ElevenLabs, voice "Ivan - Warm Russian Conversational", model eleven_v4.

Render: `node render.mjs video film.html out.mp4 --fps 24 --scale 1` (saas-animation render script), then
`python3 sound/build_audio.py sound/events.json audio [vo.mp3]` and mux with ffmpeg (`loudnorm=I=-14:TP=-1.5`).
`exports/` is not committed (large files).
