import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { citePaper } from "../../services/api";

export default function PaperCard({ paper, summary, highlights, citation }) {
  const { token } = useAuth();
  const [localCitation, setLocalCitation] = useState(citation);
  const [showBibtex, setShowBibtex] = useState(false);
  const [copiedType, setCopiedType] = useState("");
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  // How many authors to show before truncating
  const PREVIEW_COUNT = 6;

  function parseBibtex(bibtex) {
    if (!bibtex || typeof bibtex !== "string") return {};
    const fields = {};
    const re = /(\w+)\s*=\s*[{"]([^"}]+)[}"]/g;
    let match;
    while ((match = re.exec(bibtex)) !== null) {
      const key = match[1].toLowerCase();
      const val = match[2].trim();
      fields[key] = val;
    }
    if (fields.author) {
      fields.authors = fields.author.split(/\s+and\s+/i).map((s) => s.trim());
    }
    return {
      title: fields.title || fields.journal || fields.booktitle || "",
      authors: fields.authors || [],
      year: fields.year || "",
      url: fields.url || fields.link || ""
    };
  }

  function parseAPA(apa) {
    if (!apa || typeof apa !== "string") return {};
    const yearMatch = apa.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : "";
    const firstPeriod = apa.indexOf(".");
    let authors = "";
    if (firstPeriod > 0) {
      authors = apa.slice(0, firstPeriod).trim();
    }
    const urlMatch = apa.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0] : "";
    let title = "";
    if (firstPeriod > 0) {
      const after = apa.slice(firstPeriod + 1).trim();
      const cut = url ? after.split(url)[0] : after;
      const secondPeriod = cut.indexOf(".");
      title = secondPeriod > 0 ? cut.slice(0, secondPeriod).trim() : cut.trim();
    }
    return {
      title,
      authors: authors ? authors.split(",").map((s) => s.trim()) : [],
      year,
      url
    };
  }

  function copyToClipboard(text) {
    if (!navigator?.clipboard) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Copy failed", err);
      }
      document.body.removeChild(ta);
      return;
    }
    navigator.clipboard.writeText(text).catch((err) => console.error("Copy failed", err));
  }

  function handleCopy(text, type) {
    copyToClipboard(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(""), 2000);
  }

  async function handleCite() {
    try {
      const response = await citePaper(paper, token);
      // assume API returns response.citations array; take first
      setLocalCitation(response.citations?.[0] || response);
    } catch (err) {
      console.error("Citation failed:", err);
    }
  }

  const parsedFromBib = localCitation && localCitation.bibtex ? parseBibtex(localCitation.bibtex) : {};
  const parsedFromAPA = localCitation && localCitation.apa ? parseAPA(localCitation.apa) : {};
  const citationData = {
    title: parsedFromBib.title || parsedFromAPA.title || localCitation?.title || paper?.title || "",
    authors:
      (parsedFromBib.authors && parsedFromBib.authors.length)
        ? parsedFromBib.authors
        : (parsedFromAPA.authors && parsedFromAPA.authors.length)
        ? parsedFromAPA.authors
        : (paper?.authors && Array.isArray(paper.authors) ? paper.authors : (typeof paper?.authors === "string" ? [paper.authors] : paper?.authors || [])),
    year: parsedFromBib.year || parsedFromAPA.year || localCitation?.year || paper?.year || "",
    url: parsedFromBib.url || parsedFromAPA.url || localCitation?.url || paper?.url || ""
  };

  // authorsNormalized: always an array of strings
  const authorsNormalized = Array.isArray(citationData.authors)
    ? citationData.authors
    : citationData.authors
    ? String(citationData.authors).split(/\s*,\s*/).filter(Boolean)
    : [];

  const authorsCount = authorsNormalized.length;
  const previewAuthors = authorsNormalized.slice(0, PREVIEW_COUNT);

  return (
    <div className="w-full glass-card mt-4 p-4">
      <h3 className="text-lg font-semibold text-gray-100 break-words">{paper?.title || citationData.title || "No title"}</h3>

      {/* AUTHORS: truncated with show more */}
      <div className="mt-1">
        <p className="text-sm italic text-gray-300 mb-1">
          {authorsCount === 0 ? "Unknown authors" : (
            <>
              {!showAllAuthors
                ? previewAuthors.join(", ") + (authorsCount > PREVIEW_COUNT ? `, and ${authorsCount - PREVIEW_COUNT} more` : "")
                : authorsNormalized.join(", ")
              }
            </>
          )}
        </p>

        {authorsCount > PREVIEW_COUNT && (
          <button
            onClick={() => setShowAllAuthors((s) => !s)}
            className="text-xs text-primary hover:underline focus:outline-none"
            aria-expanded={showAllAuthors}
            aria-label={showAllAuthors ? "Show fewer authors" : "Show all authors"}
          >
            {showAllAuthors ? "Show less" : `Show ${authorsCount - PREVIEW_COUNT} more`}
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
        <div className="col-span-1 md:col-span-2">
          <div className="text-xs text-gray-400">Title</div>
          <div className="text-sm text-gray-100 break-words">{citationData.title || "N/A"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Authors</div>
          <div className="text-sm text-gray-100 break-words">
            {authorsCount > 0 ? (showAllAuthors ? authorsNormalized.join(", ") : previewAuthors.join(", ")) : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Year</div>
          <div className="text-sm text-gray-100">{citationData.year || "N/A"}</div>
        </div>
      </div>

      {citationData.url && (
        <div className="mt-3">
          <div className="text-xs text-gray-400">Source</div>
          <a
            href={citationData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline break-all hover:text-accent"
          >
            {citationData.url}
          </a>
        </div>
      )}

      <div className="mt-3 flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-400">APA (short)</div>
          <div className="text-sm text-gray-100 break-words">
            {localCitation?.apa ? localCitation.apa : "No APA citation available"}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {localCitation?.apa && (
            <button
              onClick={() => handleCopy(localCitation.apa, "APA")}
              className="fancy-btn text-sm"
              title="Copy APA"
            >
              {copiedType === "APA" ? "Copied!" : "Copy APA"}
            </button>
          )}
          <button
            onClick={() => setShowBibtex((s) => !s)}
            className="px-3 py-1 border border-opacity-6 border-white rounded-lg text-sm text-gray-100 hover:bg-glass"
          >
            {showBibtex ? "Hide BibTeX" : "Show BibTeX"}
          </button>
        </div>
      </div>

      {showBibtex && (
        <div className="mt-3 bg-glass p-3 rounded-lg border border-opacity-6 border-white">
          <div className="flex justify-between items-start gap-2">
            <div className="text-sm font-semibold text-gray-100">BibTeX</div>
            {localCitation?.bibtex && (
              <button
                onClick={() => handleCopy(localCitation.bibtex, "BibTeX")}
                className="fancy-btn text-xs"
                title="Copy BibTeX"
              >
                {copiedType === "BibTeX" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre className="mt-2 text-xs text-gray-100 whitespace-pre-wrap">
            {localCitation?.bibtex || "No BibTeX available"}
          </pre>
        </div>
      )}

      <p className="text-sm mt-4">
        <strong className="text-gray-100">Abstract:</strong>{" "}
        <span className="text-gray-100">{paper?.abstract || paper?.abstract_text || "No abstract"}</span>
      </p>

      <p className="text-sm mt-2">
        <strong className="text-gray-100">Summary:</strong>{" "}
        <span className="text-gray-100">{summary || "No summary"}</span>
      </p>

      {Array.isArray(highlights) && highlights.length > 0 && (
        <div className="mt-2">
          <strong className="text-gray-100">Highlights:</strong>
          <ul className="list-disc list-inside mt-1 text-gray-100">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        {paper?.url && (
          <button
            onClick={() => window.open(paper.url, "_blank", "noopener,noreferrer")}
            className="fancy-btn"
          >
            Open Paper
          </button>
        )}
      </div>
    </div>
  );
}
