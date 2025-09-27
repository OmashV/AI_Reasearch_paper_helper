import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { citePaper } from "../../services/api";

export default function PaperCard({ paper, summary, highlights, citation }) {
  const { token } = useContext(AuthContext);
  const [localCitation, setLocalCitation] = useState(citation);
  const [showBibtex, setShowBibtex] = useState(false);
  const [copiedType, setCopiedType] = useState(""); // "APA" or "BibTeX"

  // BibTeX parser
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

  // APA parser
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

  // Clipboard helper
  function copyToClipboard(text) {
    if (!navigator?.clipboard) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (err) { console.error("Copy failed", err); }
      document.body.removeChild(ta);
      return;
    }
    navigator.clipboard.writeText(text).catch((err) => console.error("Copy failed", err));
  }

  function handleCopy(text, type) {
    copyToClipboard(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(""), 2000); // reset after 2 seconds
  }

  const parsedFromBib = localCitation && localCitation.bibtex ? parseBibtex(localCitation.bibtex) : {};
  const parsedFromAPA = localCitation && localCitation.apa ? parseAPA(localCitation.apa) : {};
  const citationData = {
    title: parsedFromBib.title || parsedFromAPA.title || localCitation?.title || paper?.title || "",
    authors: parsedFromBib.authors && parsedFromBib.authors.length ? parsedFromBib.authors : (parsedFromAPA.authors && parsedFromAPA.authors.length ? parsedFromAPA.authors : paper?.authors || []),
    year: parsedFromBib.year || parsedFromAPA.year || localCitation?.year || paper?.year || "",
    url: parsedFromBib.url || parsedFromAPA.url || localCitation?.url || paper?.url || ""
  };

  return (
    <div className="w-full glass-card border border-green-600 p-4 rounded-md shadow-md mt-4">
      <h3 className="text-lg font-semibold text-black">{paper.title || "No title"}</h3>
      <p className="text-sm italic text-black/80">
        {(paper.authors && paper.authors.join(", ")) || 'Unknown authors'}
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
        <div className="col-span-1 md:col-span-2">
          <div className="text-xs text-gray-600">Title</div>
          <div className="text-sm text-black">{citationData.title || "N/A"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-600">Authors</div>
          <div className="text-sm text-black">
            {Array.isArray(citationData.authors) && citationData.authors.length
              ? citationData.authors.join(", ")
              : "N/A"}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600">Year</div>
          <div className="text-sm text-black">{citationData.year || "N/A"}</div>
        </div>
      </div>

      {citationData.url && (
        <div className="mt-3">
          <div className="text-xs text-gray-600">Source</div>
          <a
            href={citationData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-700 underline break-all"
          >
            {citationData.url}
          </a>
        </div>
      )}

      <div className="mt-3 flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-600">APA (short)</div>
          <div className="text-sm text-black/80 break-words">
            {localCitation?.apa ? localCitation.apa : "No APA citation available"}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {localCitation?.apa && (
            <button
              onClick={() => handleCopy(localCitation.apa, "APA")}
              className="px-3 py-1 bg-slate-800 text-white rounded text-sm"
              title="Copy APA"
            >
              {copiedType === "APA" ? "Copied!" : "Copy APA"}
            </button>
          )}
          <button
            onClick={() => setShowBibtex((s) => !s)}
            className="px-3 py-1 border border-slate-300 rounded text-sm"
          >
            {showBibtex ? "Hide BibTeX" : "Show BibTeX"}
          </button>
        </div>
      </div>

      {showBibtex && (
        <div className="mt-3 bg-white/30 p-3 rounded-md text-black">
          <div className="flex justify-between items-start gap-2">
            <div className="text-sm font-semibold">BibTeX</div>
            {localCitation?.bibtex && (
              <button
                onClick={() => handleCopy(localCitation.bibtex, "BibTeX")}
                className="px-3.5 py-1.5 text-xs bg-slate-800 text-white rounded "
                title="Copy BibTeX"
              >
                {copiedType === "BibTeX" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre className="mt-2 text-xs whitespace-pre-wrap">{localCitation?.bibtex || "No BibTeX available"}</pre>
        </div>
      )}

      <p className="text-sm mt-4"><strong>Abstract:</strong> <span className="text-black">{paper.abstract || 'No abstract'}</span></p>
      <p className="text-sm mt-2"><strong>Summary:</strong> <span className="text-black">{summary || 'No summary'}</span></p>

      {Array.isArray(highlights) && highlights.length > 0 && (
        <div className="mt-2">
          <strong>Highlights:</strong>
          <ul className="list-disc list-inside mt-1 text-black">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        {paper.url && (
          <button
            onClick={() => window.open(paper.url, '_blank', 'noopener,noreferrer')}
            className="fancy-btn bg-gradient-to-r from-blue-400 to-indigo-600 text-white mr-6"
          >
            Open Paper
          </button>
        )}
      </div>
    </div>
  );
}
