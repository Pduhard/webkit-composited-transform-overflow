# WebKit: composited transform change does not update ancestors' scrollable overflow

Open in a browser: https://pduhard.github.io/webkit-composited-transform-overflow/ (all cases) · [minimal.html](https://pduhard.github.io/webkit-composited-transform-overflow/minimal.html)

WebKit bug: https://bugs.webkit.org/show_bug.cgi?id=81989

## What happens

A `300×200` `overflow: hidden` box holds a full-size card with `transform: translateX(300px)`. The card is composited: it has a `transform: translateZ(0)` child, or `will-change: transform` itself. Script sets the card's transform to `translateX(0px)`.

In WebKit, the box keeps the scrollable overflow computed before the change:

- `scrollWidth` stays `600` instead of `300`;
- `scrollLeft = 150` still scrolls the box into empty space, and so do `scrollIntoView()` and focus.

Setting `transform: none`, or anything that relayouts the box, clears the stale value. Without a composited layer, WebKit is correct.

The other direction is stale too: after a relayout at `translateX(0px)`, moving the card to `translateX(100px)` leaves `scrollWidth` at `300` instead of `400`.

CSS Overflow 3 includes descendant boxes in the scrollable overflow area "accounting for transforms": https://drafts.csswg.org/css-overflow-3/#scrollable-overflow-region

## Results

`index.html`, after two animation frames per step. Expected values in brackets.

| Case | Safari 26.6.2 (macOS 26.6.2) | iOS 26.4 Simulator Safari | Playwright WebKit 26.4 | Chrome 154, Playwright Chromium 148 | Playwright Firefox 150 |
| --- | --- | --- | --- | --- | --- |
| `translateZ(0)` child, `translateX(0px)` [300, 0] | 600, 150 | 600, 150 | 600, 150 | 300, 0 | 300, 0 |
| `will-change` card, `translateX(0px)` [300, 0] | 600, 150 | 600, 150 | 600, 150 | 300, 0 | 300, 0 |
| no layer, `translateX(0px)` [300, 0] | 300, 0 | 300, 0 | 300, 0 | 300, 0 | 300, 0 |
| after relayout, `translateX(100px)` [400, 100] | 300, 0 | 300, 0 | 300, 0 | 400, 100 | 400, 100 |

Each cell is `scrollWidth, scrollLeft after setting it to 150`.

## Run it

```sh
npm install
npx playwright install chromium firefox webkit
node run.mjs              # index.html
node run.mjs minimal.html
node run.mjs index.html chrome   # installed Chrome instead of Playwright Chromium
```

## Where it shows up

react-native-web's `ScrollView` sets `transform: translateZ(0)`. A stack navigator that slides screens in with a JS-driven `translateX` then leaves the `overflow: hidden` screen container twice as wide as it should be after every transition, and scrolling a control into view shifts the whole screen sideways. `overflow: clip` on the container stops the sideways scroll, since a `clip` box is not a scroll container; its `scrollWidth` still reads `600` (measured in Safari 26.6.2 and Playwright WebKit 26.4).
