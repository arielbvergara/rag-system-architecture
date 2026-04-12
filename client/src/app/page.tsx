import Link from "next/link";

const FEATURES = [
  {
    title: "Google Calendar",
    desc: "Read events via Calendar API using a service account",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Google Sheets",
    desc: "Read spreadsheet data via Sheets API",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    title: "Google Drive",
    desc: "List and download files via Drive API",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    title: "Service Account",
    desc: "Server-side auth — no user login required",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Gmail API",
    desc: "Send transactional emails via OAuth2 user credentials",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

const EXAMPLES = [
  {
    href: "/calendar",
    label: "View Calendar Events",
    desc: "Browse upcoming events from your Google Calendar",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/book-appointment",
    label: "Book an Appointment",
    desc: "Simulate booking a doctor visit — creates a real calendar event",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "Contact Us",
    desc: "Submit a contact request — appends a row to a Google Sheet",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    href: "/email",
    label: "Send Email",
    desc: "Send a transactional email via the Gmail API using OAuth2",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    href: "/menu",
    label: "Restaurant Menu",
    desc: "Display a restaurant menu fetched from a Google Sheet",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    href: "/location",
    label: "Our Location",
    desc: "View our location on a map along with Google reviews and rating",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    href: "/nearby-restaurants",
    label: "Nearby Restaurants Without a Website",
    desc: "Restaurants within 5 km with no website — potential clients",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
];

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 text-xs font-medium text-[var(--accent)] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Starter Kit
          </div>
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            Next.js + Express
          </h1>
          <p className="text-lg text-[var(--muted)] leading-relaxed">
            Google Calendar, Sheets, Drive &amp; Gmail pre-configured and ready to use.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors duration-150 cursor-pointer"
            >
              Open Dashboard
            </Link>
            <a
              href="https://github.com/arielbvergara/nextjs-express-starter/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors duration-150 cursor-pointer"
            >
              Documentation
            </a>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3 text-left text-sm">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">{feature.title}</h3>
              <p className="text-[var(--muted)] mt-1 text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Examples list */}
        <div className="text-left">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
            Usage Examples
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLES.map((example) => (
              <Link
                key={example.href}
                href={example.href}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-150 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                  {example.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--foreground)] text-sm">{example.label}</h3>
                  <p className="text-[var(--muted)] mt-0.5 text-xs leading-relaxed">{example.desc}</p>
                </div>
                <span className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors duration-150">
                  <ChevronRightIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
