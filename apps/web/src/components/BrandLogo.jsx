export default function BrandLogo({className=''}) {
  // Keep the supplied artwork intact and display its logo through the SVG viewport.
  return <svg className={`sam-logo ${className}`} viewBox="49 611 599 249" role="img" aria-label="Sam Store, since 2026">
    <image href="/brand/sam-store-original.jpg" width="709" height="1536"/>
  </svg>;
}
