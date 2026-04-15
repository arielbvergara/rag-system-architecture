import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { LinkButton } from "@/components/ui/LinkButton";

const FEATURES = [
  {
    title: "Upload Documents",
    desc: "Ingest PDF, plain text, and Markdown files into the knowledge base.",
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
    title: "Semantic Search",
    desc: "Queries are embedded and matched to the most relevant document chunks.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: "Grounded Answers",
    desc: "LLM responses are grounded in your documents with source citations.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Streaming Responses",
    desc: "Text streams back in real-time so you never wait for a full response.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Provider-Agnostic",
    desc: "Swap between Gemini, OpenAI, or any OpenAI-compatible endpoint via config.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Local-First Storage",
    desc: "Vectors and metadata persist on disk — no external database required.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full space-y-10">

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 text-xs font-medium text-[var(--accent)] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Retrieval-Augmented Generation
          </div>
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            Chat with your documents
          </h1>
          <p className="text-lg text-[var(--muted)] leading-relaxed">
            Upload any document and ask questions. Answers are grounded in your content with source citations.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <LinkButton href="/documents">Upload Documents</LinkButton>
            <LinkButton href="/chat" variant="secondary">Start Chatting</LinkButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left text-sm">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="p-4 shadow-sm"
            >
              <IconCircle size="sm" shape="square" className="mb-3">
                {feature.icon}
              </IconCircle>
              <h3 className="font-semibold text-[var(--foreground)]">{feature.title}</h3>
              <p className="text-[var(--muted)] mt-1 text-xs leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>

      </div>
    </main>
  );
}
