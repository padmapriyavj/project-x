import { Link } from 'react-router'

export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-surface shadow-soft rounded-[var(--radius-lg)] border border-divider/60 p-8 text-left">
        <h1 className="text-foreground mb-2 text-3xl md:text-4xl">
          Learning that shows up for you
        </h1>
        <p className="text-foreground/85 max-w-2xl text-lg leading-relaxed">
          Tempos, duels, Finn the Fox, and your actual coursework — scaffold routes
          are wired; dashboards and auth flows come next.
        </p>
      </div>
      <p className="text-foreground/70 text-center text-sm">
        <Link to="/login" className="text-primary font-medium underline-offset-2 hover:underline">
          Log in
        </Link>
        {' · '}
        <Link to="/signup" className="text-primary font-medium underline-offset-2 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
