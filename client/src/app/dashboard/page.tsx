"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarEvent, DriveFile } from "@/types";

export default function DashboardPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [activeTab, setActiveTab] = useState<"calendar" | "sheets" | "drive">(
    "calendar"
  );
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        if (activeTab === "calendar") {
          const res = await api.calendar.listEvents(5);
          if (res.success && res.data) {
            setEvents(res.data as CalendarEvent[]);
          }
        } else if (activeTab === "drive") {
          const res = await api.drive.listFiles(10);
          if (res.success && res.data) {
            setFiles(res.data as DriveFile[]);
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [activeTab]);

  const tabs = [
    { id: "calendar" as const, label: "Calendar" },
    { id: "sheets" as const, label: "Sheets" },
    { id: "drive" as const, label: "Drive" },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
        <h1
          className="text-2xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-family-heading)" }}
        >
          Dashboard
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px cursor-pointer ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {loadingData ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[var(--border)] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-[var(--foreground)]">Upcoming Events</h2>
                {events.length === 0 ? (
                  <p className="text-[var(--muted)] text-sm">
                    No upcoming events found.
                  </p>
                ) : (
                  events.map((event, i) => (
                    <div
                      key={event.id || i}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                    >
                      <h3 className="font-medium text-[var(--foreground)]">{event.summary}</h3>
                      {event.start?.dateTime && (
                        <p className="text-sm text-[var(--muted)] mt-1">
                          {new Date(event.start.dateTime).toLocaleString()}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-[var(--foreground)] mt-2">{event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sheets Tab */}
            {activeTab === "sheets" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-[var(--foreground)]">Google Sheets</h2>
                <p className="text-[var(--muted)] text-sm">
                  Use the API client to read spreadsheets.
                  See <code className="bg-[var(--border)] px-1.5 py-0.5 rounded text-xs text-[var(--foreground)]">src/lib/api.ts</code> for
                  available methods.
                </p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                  <pre className="text-xs overflow-x-auto text-[var(--foreground)]">
{`// Read a spreadsheet
const data = await api.sheets.read("spreadsheetId", "Sheet1!A1:D10");`}
                  </pre>
                </div>
              </div>
            )}

            {/* Drive Tab */}
            {activeTab === "drive" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-[var(--foreground)]">Google Drive Files</h2>
                {files.length === 0 ? (
                  <p className="text-[var(--muted)] text-sm">
                    No files found.
                  </p>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                    >
                      <div>
                        <h3 className="font-medium text-sm text-[var(--foreground)]">{file.name}</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {file.mimeType}
                        </p>
                      </div>
                      {file.modifiedTime && (
                        <span className="text-xs text-[var(--muted)]">
                          {new Date(file.modifiedTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
