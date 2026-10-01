# Hero videos

Made 2026-09-25. Sources are in `level up ai/website video/`. Only `hero-fr-desktop-2160p.mp4` is 4K, and it is an AI upscale.

| File | Built from | Notes |
|---|---|---|
| `hero-en-desktop-720p.mp4` | `LevelUpIA_english-horizontal.mp4` (1280×720) | Copied without re-encoding, only moved the index to the front so playback starts sooner. This is the master of the current English cut. |
| `hero-fr-desktop-1080p.mp4` | `French version horizontale.mp4` (3840×2160) | H.264 High, CRF 26. |
| `hero-fr-mobile-720x1272.mp4` | `Final vertical video with F audio.mp4` (2160×3816) | H.264 High, CRF 25. |
| `hero-fr-desktop-2160p.mp4` | `website video/hf_20260926_033756_7c8ac851-56c1-46ca-8d5c-08761561aeba.mp4` | **AI-upscaled 4K, not native.** Higgsfield ByteDance upscale (preset aigc, 4K, 30 fps) of a clean 1080p copy of `French version horizontale.mp4`, 2026-09-25, 2.68 credits. H.264 High 5.1, CRF 27, 26 MB. Served only to high-resolution desktop screens (VideoSlot `HIRES_QUERY`); everyone else gets the 1080p file. Sound and timing checked identical to the source. |
| `hero-en-desktop-2160p.mp4` | `website video/hf_20260926_040351_20d9499a-4411-4553-830e-8bee9cd12e8a.mp4` | **AI-upscaled 4K.** ByteDance upscale of `LevelUpIA_english-horizontal.mp4` (1280×720). CRF 27, 27 MB. High-resolution desktop screens only. |
| `hero-fr-mobile-1080x1906.mp4` | `website video/hf_20260926_040352_9adaad1c-ec89-4954-827c-deded87f959e.mp4` (2160×3810) | Downscaled from the AI 4K upscale of a clean 1080-wide copy of `Final vertical video with F audio.mp4`. CRF 26, 12 MB. Phones cannot display more than about 1,290 px across, so the full 4K stays in `website video/`. |
| `hero-en-mobile-1080x1906.mp4` | `website video/hf_20260926_040354_f32c4eeb-688e-4993-84cc-4597c1df1302.mp4` (2160×3818) | Downscaled from the AI 4K upscale of `vertical video English.mp4` (480×848, the only English vertical cut). CRF 26, 13 MB. |
| `hero-en-poster.jpg`, `hero-fr-poster.jpg` | frame at 0.3 s of the desktop cut | |
| `hero-en-desktop-1080p.mp4` | `website video/hf_20260926_040351_20d9499a-….mp4` (EN 4K upscale) | Made 2026-09-25 to replace the 720p file on ordinary (non high-resolution) desktop screens. Lanczos downscale, H.264 High, CRF 23, 12 MB, sound copied from the upscale. SSIM against the 4K master at 1080p: 0.993 (the old 720p file: 0.986). |
| `hero-fr-desktop-1080p_2026-09-25_from-4k.mp4` | `website video/hf_20260926_033756_7c8ac851-….mp4` (FR 4K upscale) | Replaces `hero-fr-desktop-1080p.mp4` on ordinary desktop screens, same settings, 12 MB. SSIM 0.993 (the old file: 0.983). |
| `hero-en-poster_2026-09-25_from-4k.jpg`, `hero-fr-poster_2026-09-25_from-4k.jpg` | frame at 0.3 s of the 4K upscales, 1920x1080 | Replace the older posters. |

The three later upscales were made on 2026-09-25 with the same ByteDance settings (4K, preset aigc, 30 fps) for 7.97 credits together. Every upscale was checked frame-for-frame and for identical audio against its source.

The files these replaced (`hero-fr-mobile-720x1272.mp4`, `hero-en-desktop-720p.mp4`, `hero-fr-desktop-1080p.mp4`, the two older posters, `/phone-preview-v2.mp4`) are still in the project, unused.

## Why these are not 4K

The two "4K" French files are upscales. Shrinking them to 960×540 and scaling back up changes almost nothing (PSNR about 53 dB), so they hold roughly 540p of real detail. Serving them at 4K would only make the download bigger.

`Website Landing page.mp4` and `VIDEO2.mp4` are also 3840×2160 upscales. They're older English edits with the yellow "Level up AI" end card, not the current purple "Level up IA" one.

## Needed for real 4K

A 3840×2160 export straight from the generator or editor timeline, not upscaled afterwards:

1. The English horizontal cut with the purple "Level up IA" end card
2. The English vertical cut
3. The French horizontal and vertical cuts

## 2026-09-26: blue lettering, sneaker replaced

Current files: `hero-{fr,en}-desktop-{2160p,1080p}_2026-09-26_perfume.mp4` and `hero-{fr,en}-mobile-1080x1906_2026-09-26_perfume.mp4`,
each built in one pass from its 4K master in `website video/` (sound copied untouched, same length, no colour shift):

1. The sneaker shot (computer: frames 640-757, 21.33-25.27 s; phone: frames 645-773, 21.5-25.8 s) is replaced by the perfume bottle
   from `perfume copy.mp4` (10.2-14.6 s), upscaled to 4K with Higgsfield ByteDance (4K, aigc, 30 fps, 0.35 credits):
   `website video/hf_20260927_015216_d5660948-63ac-452e-9cc4-b3cd8071b5ee.mp4`. Phones get a centred 9:16 crop of it.
2. The captions that ran over the sneaker are redrawn in the same place and timing (computer: "SHOOT YOUR PRODUCTS." then
   "BUILD PREMIUM ADS."; phone: "CREATE UGC VIDEOS." then "SHOOT YOUR PRODUCTS."), Tahoma with a light outline, matched to the
   originals' letter height, width and position.
3. The purple "Powered by Level up IA" and "DM / Level up IA" lettering is recoloured to the site blue (hue only; the purple-lit
   scene earlier in the video is untouched).

The `_2026-09-26_blue` files (lettering only, sneaker still in) and all earlier files are kept, unused.

## 2026-09-26: "Level up AI", sharper phone files

Current files: `hero-{fr,en}-desktop-{2160p,1080p}_2026-09-26_ai.mp4` and `hero-{fr,en}-mobile-1440x2540_2026-09-26_ai.mp4`.
Same build as the `_perfume` files above, plus two changes:

1. "Level up IA" reads "Level up AI" on both lettering lines: "Powered by Level up AI" (computer only, 26.93-28.93 s, still one
   blue line as in the original) and the "DM / Level up AI" end card (computer from 31.67 s, phone from 30.57 s). The letters are
   the video's own: the old "IA" is erased and its A and I are put back in the other order, in the same width, so the line stays
   centred. A two-line layout ("Powered" in white under "Your vision") was built and previewed, and Sarra kept the single line.
2. The phone files are 1440x2540 (CRF 25, about 20 MB) instead of 1080x1906 (CRF 26, 12 MB). The earlier note that a phone
   "cannot show more than about 1,290 px" was wrong for this video: the hero fills the screen's height, so an iPhone shows it
   about 2,550 physical px tall and the 1906 px file was being stretched about 1.34x. A CRF 22 version (about 28 MB) looked the
   same at 1:1 and was left out for size.

Checks: sound identical to the 4K master; same frame count and length as the files they replace; outside the lettering the
computer files match the `_perfume` files (mean difference 0.3 levels, no brightness shift); the phone files are within 0.1 level
of the master's brightness and closer to the master than the 1080 files (mean error 1.3 against 1.75). Brightness was compared
with ffmpeg's `accurate_rnd+full_chroma_int` flags: without them, a frame that gets resized reads about 0.9 level darker than
one that does not, which looks like a colour shift that is not in the files.

The `_perfume` files and all earlier ones are kept, unused.

## 2026-09-29: purple lettering

`hero-{fr,en}-desktop-{2160p,1080p}_2026-09-29_purple.mp4` and `hero-{fr,en}-mobile-1440x2540_2026-09-29_purple.mp4`: the `_ai`
files with the blue "Powered by Level up AI" and "DM / Level up AI" lettering turned to the site's violet (#9B6BFF hue, the
letters' own shading kept). Everything before the join keyframe is copied from the `_ai` file without re-encoding (computer:
frame 803 at 4K, 808 at 1080p; phone: frame 900), the rest re-encoded with the same settings. Checked: same frame count and
length, sound identical, frames before the join identical, no decode errors. The `_ai` files are kept, unused.
