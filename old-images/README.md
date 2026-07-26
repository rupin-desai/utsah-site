# Archived gallery images

These are the images that **used to** feed two places on the site:

1. **Home page** — the full-screen photo section above Google Reviews
   (`#fsGallery`, driven by the `photos` array in `public/script.js`).
2. **Events page** — the "Our Gallery" editorial preview and the full-screen
   gallery overlay it opens (`content/events.json`).

They were moved out of `public/` on 2026-07-26 and replaced by the new set in
`public/assets/gallery/` (`g01.jpeg` … `g27.jpeg`). Nothing on the live site
references anything in this folder, so these files are not shipped to visitors.

## What is here

| Folder | Count | Original location |
| --- | --- | --- |
| `gallery/wedding/` | 27 (`pw1`–`pw27`) | `public/assets/events/wedding/` |
| `gallery/corporate/` | 45 (`pc1`–`pc45`) | `public/assets/events/corporate/` |
| `gallery/live/` | 19 (`pl1`–`pl19`) | `public/assets/events/live/` |
| `unused-gallery-small/` | 14 (`1-small`–`13-small`, `website-pictures-small`) | `public/assets/gallery/` |

`unused-gallery-small/` was already dead weight before this change — those files
sat in `public/assets/gallery/` but nothing in the codebase referenced them. They
were moved here so that folder holds exactly the 27 photos in use.

Only the `p`-prefixed files were archived. The other images in
`public/assets/events/*` (`w*`, `uw*`, `ww*`, `c*`, `l*`, `cover*`) are still in
use by the wedding / corporate / live / memories pages and were left alone.

## To restore one

Copy it back into the matching `public/assets/events/<category>/` folder and add
its path to `public/script.js` (home) and/or the `#galleryDataPool` list in
`content/events.json` (events).

## New set — filename mapping

`public/assets/gallery/gNN.jpeg` came from the `photos/` staging folder:

| New | Original filename |
| --- | --- |
| g01 | 061A4469 Large.jpeg |
| g02 | 061A5131 Large.jpeg |
| g03 | 161A7643 Large.jpeg |
| g04 | 161A8322 Large.jpeg |
| g05 | DPS05575 Large.jpeg |
| g06 | DPS05684 Large.jpeg |
| g07 | DPS07153 Large.jpeg |
| g08 | DPS07557 Large.jpeg |
| g09 | DSC03821 Large.jpeg |
| g10 | DSC07546 Large.jpeg |
| g11 | IMG_1897 Large.jpeg |
| g12 | IMG_1899 Large.jpeg |
| g13 | IMG_1901 Large.jpeg |
| g14 | IMG_1902 Large.jpeg |
| g15 | Lavesh&Pooja - Haldi 2755-2 Large.jpeg |
| g16 | Lavesh&Pooja - Haldi 602 Large.jpeg |
| g17 | Lavesh&Pooja - Haldi 604 Large.jpeg |
| g18 | Lavesh&Pooja - Wedding & Reception 1502 Large.jpeg |
| g19 | Lavesh&Pooja - Wedding & Reception 1552 Large.jpeg |
| g20 | Lavesh&Pooja - Wedding & Reception 2653 Large.jpeg |
| g21 | NAP03776 Large.jpeg |
| g22 | PHOTO-2023-04-06-23-09-17 Large.jpeg |
| g23 | WhatsApp Image 2023-04-06 at 10.07.38 AM Large.jpeg |
| g24 | WhatsApp Image 2023-04-06 at 10.07.39 AM Large.jpeg |
| g25 | WhatsApp Image 2023-04-06 at 9.37.26 AM Large.jpeg |
| g26 | dady Large.jpeg |
| g27 | kaka Large.jpeg |

### Category assignment used on the Events page

The events gallery filters by category, so the new set was split by what each
photo shows. Almost all 27 are wedding-function photos, so the corporate and
live buckets are thin — adjust `data-cat` in `content/events.json` if you want a
different split.

- **wedding** — g01–g04, g06–g10, g15–g24
- **live** — g05, g13, g14, g25, g26, g27
- **corporate** — g11, g12 (banquet-hall stage and hall setups)
