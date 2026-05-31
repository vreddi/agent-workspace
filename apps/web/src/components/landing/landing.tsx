import { Canyon } from './canyon'
import { Header } from './header'
import { Hero } from './hero'
import { landingStyles } from './styles'

export function Landing() {
  return (
    <div className="landing-root">
      <style>{landingStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      />
      <Canyon />
      <Header />
      <Hero />
    </div>
  )
}
