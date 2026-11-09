// Desktop pictures, generated as vector art (no Apple images). Each is a CSS background value.

import type { WallpaperId } from '../model/prefs';

const svg = (body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>${body}</svg>`)}")`;

function ribbons(deep: string, mid: string, light: string, glow: string): string {
  return svg(`
<defs>
  <linearGradient id='bg' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='${deep}'/><stop offset='.55' stop-color='${mid}'/><stop offset='1' stop-color='${light}'/></linearGradient>
  <linearGradient id='rb' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${glow}' stop-opacity='0'/><stop offset='.45' stop-color='${glow}' stop-opacity='.55'/><stop offset='1' stop-color='${glow}' stop-opacity='.08'/></linearGradient>
  <radialGradient id='sp' cx='.62' cy='.62' r='.6'><stop offset='0' stop-color='#ffffff' stop-opacity='.28'/><stop offset='1' stop-color='#ffffff' stop-opacity='0'/></radialGradient>
  <filter id='b1' x='-20%' y='-50%' width='140%' height='200%'><feGaussianBlur stdDeviation='26'/></filter>
  <filter id='b2' x='-20%' y='-50%' width='140%' height='200%'><feGaussianBlur stdDeviation='9'/></filter>
  <filter id='b3' x='-20%' y='-50%' width='140%' height='200%'><feGaussianBlur stdDeviation='2.5'/></filter>
</defs>
<rect width='1600' height='1000' fill='url(#bg)'/>
<rect width='1600' height='1000' fill='url(#sp)'/>
<path d='M-200 690C180 560 520 820 900 690S1500 430 1820 520L1820 650C1460 600 1260 830 900 840S220 700-200 820Z' fill='url(#rb)' filter='url(#b1)'/>
<path d='M-200 600C260 470 600 700 980 600S1520 380 1820 430L1820 470C1500 430 1300 640 980 660S260 540-200 660Z' fill='url(#rb)' opacity='.8' filter='url(#b2)'/>
<path d='M-200 760C240 640 640 880 1020 740S1560 500 1820 560' fill='none' stroke='${glow}' stroke-opacity='.7' stroke-width='5' filter='url(#b3)'/>
<path d='M-200 640C220 520 620 760 1000 640S1540 420 1820 470' fill='none' stroke='#ffffff' stroke-opacity='.45' stroke-width='2.5' filter='url(#b3)'/>
<path d='M-200 860C300 760 700 960 1100 820S1600 640 1820 700' fill='none' stroke='${glow}' stroke-opacity='.35' stroke-width='14' filter='url(#b2)'/>`);
}

function swirl(): string {
  return svg(`
<defs>
  <radialGradient id='bg' cx='.5' cy='.45' r='.85'><stop offset='0' stop-color='#4f9ef0'/><stop offset='.6' stop-color='#1f5fc1'/><stop offset='1' stop-color='#0b2f73'/></radialGradient>
  <filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='14'/></filter>
</defs>
<rect width='1600' height='1000' fill='url(#bg)'/>
<g fill='none' stroke='#cfe6ff' filter='url(#b)'>
  <path d='M300 900C200 500 600 150 1000 250S1500 750 1100 850 600 600 800 450' stroke-width='60' stroke-opacity='.28'/>
  <path d='M100 300C400 100 900 120 1200 380S1300 900 900 900' stroke-width='34' stroke-opacity='.22'/>
  <path d='M1500 150C1300 400 1100 300 900 520S500 980 200 760' stroke-width='22' stroke-opacity='.3'/>
</g>`);
}

const solid = (top: string, bottom: string) => `linear-gradient(${top}, ${bottom})`;

export const WALLPAPER_CSS: Record<WallpaperId, string> = {
  'aqua-blue': ribbons('#0a2f74', '#1d5fc0', '#5aa5ec', '#d7ecff'),
  'aqua-graphite': ribbons('#2b2f36', '#565d68', '#9aa2ad', '#eef1f5'),
  'jaguar-swirl': swirl(),
  'solid-blue': solid('#3d78c9', '#3570c2'),
  'solid-gray': solid('#8a8f96', '#83888f'),
  'solid-gray-dark': solid('#4b4f55', '#45494f'),
};
