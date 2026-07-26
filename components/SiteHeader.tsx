'use client';

import FluidGlass from './FluidGlass';
import { navigation } from './site-data';

const navItems = [
  { label: 'Home', link: '/' },
  ...navigation.map(item => ({ label: item.label, link: item.href })),
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 -mb-24 h-24">
      <FluidGlass
        mode="bar"
        barProps={{
          navItems,
          scale: 0.15,
          ior: 2,
          thickness: 1,
          chromaticAberration: 0,
          anisotropy: 0,
          transmission: 1,
          roughness: 0,
        }}
      />
    </header>
  );
}
