# Sum up 26 November's world news in one image

[![news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/dwi085/makefun-news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/dwi085/makefun-news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

An entry for the [make.fun bounty "Sum up 26 November's world news in one image"](https://make.fun/bounty/news-image-20261126) (news-image-20261126, $100, top 50).

## What it does

`main.ts` (Node 22, standard library only) draws a newspaper front page of
Thursday 26 November 2026 and writes it to `/output/entry.png`
(`$MAKEFUN_OUTPUT_DIR` when set). No network, no fonts, no dependencies:
the text is drawn with a hand-made 5x7 bitmap font and the PNG is encoded
with `node:zlib`, so two runs produce byte-identical output.

The front page packs **38 sourced stories** of the day:

- **Lead:** Houthi strikes on Saudi Arabia's Ras Tanura refinery and a Riyadh
  tower; Wall Street's dive into Thanksgiving (Micron -10%, AMD -9%,
  Nvidia -7%).
- **War & Diplomacy:** Ukraine's Blysk laser downing a jet-powered Geran
  drone, strikes on energy sites in Ukraine and Russia, the Zaporizhzhia
  plant losing power, Gaza strikes, Russian missiles hitting NATO member
  Poland, and the leaked toll of 490,334 Russian soldiers dead.
- **Markets & Tech:** US Q3 GDP +4.3%, PCE inflation 3.8%, new US tariffs on
  14 trading partners, Dell's record $132.3B AI backlog, global chip sales
  of $517.7B, the FCC clearing SpaceX for up to 1 million satellites.
- **World, Sport & Life:** the UK RAF sheltering jets from drones, the
  Nexperia row, Poundland's administration, the midterms, the EU's quantum
  plan, the Qatar GP feud, Black Friday opt-outs, and Xavier's win over
  Texas A&M — plus a pin map and a UTC timeline of the day.

Every story carries its UTC time and its source (Reuters, AP, BBC,
Al Jazeera, CNA, TASS, Fox Business, Morningstar, Dow Jones, NYT, and
others). Nothing is invented.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Output: `out/entry.png` — 1024x1024 PNG, well under the 1 MiB limit,
byte-identical across runs.

## License

MIT — see [LICENSE](LICENSE).
