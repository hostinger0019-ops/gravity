"use client";

import { useFormContext } from "react-hook-form";
import type { KnowledgeValues } from "./schemas";
import { useCallback, useMemo, useState } from "react";
const devNoAuth = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

// Icons as simple SVG components
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export function KnowledgeForm({ botId }: { botId?: string }) {
  const form = useFormContext<KnowledgeValues>();
  const [input, setInput] = useState("");
  const kbLen = form.watch("knowledge_base")?.length || 0;
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [vecStatus, setVecStatus] = useState<string | null>(null);
  const [vecError, setVecError] = useState<string | null>(null);
  const fileNameForText = useMemo(() => "manual.txt", []);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeDepth, setScrapeDepth] = useState(1);
  const [scrapeMax, setScrapeMax] = useState(25);
  const [scrapeIngest, setScrapeIngest] = useState(true);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'website' | 'manual'>('upload');
  const [pdfUploading, setPdfUploading] = useState(false);
  // Sitemap page selection
  const [scrapeStep, setScrapeStep] = useState<'url' | 'select' | 'importing'>('url');
  const [isFetchingPages, setIsFetchingPages] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<{ url: string; group: string }[]>([]);
  const [discoveredGroups, setDiscoveredGroups] = useState<Record<string, string[]>>({});
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [sitemapSource, setSitemapSource] = useState<string>("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    const curr = form.getValues("starter_questions") || [];
    if (curr.length >= 6) return;
    form.setValue("starter_questions", [...curr, v], { shouldDirty: true });
    setInput("");
  };

  const remove = (i: number) => {
    const curr = form.getValues("starter_questions") || [];
    form.setValue(
      "starter_questions",
      curr.filter((_, idx) => idx !== i),
      { shouldDirty: true }
    );
  };

  const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Read failed"));
      reader.readAsText(file);
    });

  const getUserId = useCallback(async (): Promise<string | null> => {
    // Dev mode: use fallback UUID
    if (devNoAuth) return "00000000-0000-0000-0000-000000000000";
    // Production: check localStorage for stored user ID
    try {
      const uid = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
      return uid || null;
    } catch {
      return null;
    }
  }, []);

  const onUploadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImportError(null);
    setIsImporting(true);
    try {
      const supported = [".txt", ".md", ".csv", ".json"];
      const parts: string[] = [];
      for (const f of Array.from(files)) {
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        const dotExt = ext ? `.${ext}` : "";
        if (dotExt === ".pdf" || dotExt === ".docx") {
          const formData = new FormData();
          formData.append("file", f);
          const res = await fetch("/api/extract", { method: "POST", body: formData });
          if (!res.ok) {
            parts.push(`\n\n---\n[Failed to extract ${f.name}]`);
          } else {
            const { text } = await res.json();
            parts.push(`\n\n---\nSource: ${f.name}\n\n${(text || "").trim()}`);
          }
        } else if (supported.includes(dotExt)) {
          const text = await readFileAsText(f);
          const clean = text.replace(/\u0000/g, "").trim();
          parts.push(`\n\n---\nSource: ${f.name}\n\n${clean}`);
        } else {
          parts.push(`\n\n---\n[Skipped unsupported file: ${f.name}]`);
        }
      }
      const existing = form.getValues("knowledge_base") || "";
      const combined = (existing + parts.join("")).trim();
      form.setValue("knowledge_base", combined, { shouldDirty: true });
    } catch (e: any) {
      setImportError(e?.message || "Failed to import files.");
    } finally {
      setIsImporting(false);
    }
  }, [form]);

  const saveTextareaToVector = useCallback(async () => {
    setVecError(null);
    setVecStatus("Processing your content...");
    try {
      if (!botId) throw new Error("Please save your chatbot first before adding knowledge.");
      const userId = await getUserId();
      if (!userId) throw new Error("Please sign in to add knowledge.");
      const text = (form.getValues("knowledge_base") || "").toString().trim();
      if (!text) throw new Error("Please add some text first.");
      const res = await fetch("/api/knowledge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          chatbotId: botId,
          inputType: "text",
          data: text,
          fileName: fileNameForText,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || "Failed to save knowledge");
      setVecStatus(`Successfully added! Your chatbot can now answer questions about this content.`);
    } catch (e: any) {
      setVecError(e?.message || "Failed to save knowledge.");
      setVecStatus(null);
    }
  }, [botId, form, getUserId, fileNameForText]);

  const onUploadPdfToVector = useCallback(async (file: File | null) => {
    if (!file) return;
    setVecError(null);
    setPdfUploading(true);
    setVecStatus("Uploading and processing your PDF...");
    try {
      if (!botId) throw new Error("Please save your chatbot first before uploading files.");
      const userId = await getUserId();
      if (!userId) throw new Error("Please sign in to upload files.");
      if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Please select a PDF file.");
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/knowledge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          chatbotId: botId,
          inputType: "pdf",
          data: base64,
          fileName: file.name,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || "Failed to upload PDF");
      setVecStatus(`"${file.name}" uploaded successfully! Your chatbot can now answer questions about it.`);
    } catch (e: any) {
      setVecError(e?.message || "Failed to upload PDF.");
      setVecStatus(null);
    } finally {
      setPdfUploading(false);
    }
  }, [botId, getUserId]);

  const onFetchPages = useCallback(async () => {
    setScrapeError(null);
    setScrapeStatus(null);
    setIsFetchingPages(true);
    try {
      const url = scrapeUrl.trim();
      if (!url) throw new Error("Please enter a website URL.");
      const res = await fetch("/api/knowledge/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || "Failed to discover pages");
      if (!out.urls?.length) throw new Error("No pages found on this website.");

      const pages = (out.urls as string[]).map((u: string) => {
        const segments = new URL(u).pathname.split("/").filter(Boolean);
        return { url: u, group: segments[0] || "(root)" };
      });
      setDiscoveredPages(pages);
      setDiscoveredGroups(out.groups || {});
      setSelectedPages(new Set(pages.map((p: { url: string }) => p.url)));
      setSitemapSource(out.source || "");
      setScrapeStep('select');
    } catch (e: any) {
      setScrapeError(e?.message || "Failed to fetch pages.");
    } finally {
      setIsFetchingPages(false);
    }
  }, [scrapeUrl]);

  const onScrapeSelected = useCallback(async () => {
    setScrapeError(null);
    setScrapeStatus("Importing selected pages...");
    setScrapeStep('importing');
    try {
      if (!botId) throw new Error("Please save your chatbot first.");
      const userId = await getUserId();
      if (!userId) throw new Error("Please sign in to import websites.");
      const urls = Array.from(selectedPages);
      if (urls.length === 0) throw new Error("Please select at least one page.");
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, chatbotId: botId, urls, ingest: scrapeIngest }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || "Failed to import website");
      if (out.job_id) {
        // GPU async mode — job is running in background workers
        setScrapeStatus(`✅ ${urls.length} pages sent to GPU workers! Processing in background — your chatbot will be updated automatically.`);
      } else {
        setScrapeStatus(`Successfully imported ${out.processed} pages!`);
      }

      setScrapeStep('url');
      setDiscoveredPages([]);
      setSelectedPages(new Set());
    } catch (e: any) {
      setScrapeError(e?.message || "Failed to import website.");
      setScrapeStep('select');
      setScrapeStatus(null);
    }
  }, [botId, selectedPages, scrapeIngest, getUserId]);

  const togglePage = (url: string) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupUrls = discoveredGroups[group] || [];
    setSelectedPages(prev => {
      const next = new Set(prev);
      const allSelected = groupUrls.every(u => next.has(u));
      groupUrls.forEach(u => allSelected ? next.delete(u) : next.add(u));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">Train Your Chatbot</h2>
        <p className="text-xs text-gray-500">Add documents, websites, or text to teach your chatbot about your content.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'upload'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          📄 Upload Files
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('website')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'website'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          🌐 Import Website
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'manual'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          ✍️ Add Text
        </button>
      </div>

      {/* Upload Files Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          {/* PDF Upload Card */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors bg-gray-50">
            <div className="flex flex-col items-center">
              <div className="text-indigo-500 mb-2">
                <UploadIcon />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Upload PDF Documents</h3>
              <p className="text-xs text-gray-500 mb-3">
                Upload PDF files and your chatbot will learn from their contents
              </p>
              <label className="cursor-pointer">
                <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors ${botId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}>
                  {pdfUploading ? <SpinnerIcon /> : null}
                  {pdfUploading ? 'Uploading...' : 'Choose PDF File'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onUploadPdfToVector(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={!botId || pdfUploading}
                />
              </label>
              {!botId && (
                <p className="mt-3 text-sm text-amber-600">Save your chatbot first to enable uploads</p>
              )}
            </div>
          </div>

          {/* Other Files */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-gray-400">
                <DocumentIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Other File Types</h3>
                <p className="text-xs text-gray-500 mb-2">Upload text, markdown, CSV, or JSON files</p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Choose Files
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md,.csv,.json"
                    onChange={(e) => onUploadFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                {isImporting && <p className="mt-2 text-sm text-indigo-600">Importing...</p>}
                {importError && <p className="mt-2 text-sm text-red-500">{importError}</p>}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(vecStatus || vecError) && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${vecError ? 'bg-red-50' : 'bg-green-50'}`}>
              {vecError ? (
                <span className="text-red-500">⚠️</span>
              ) : (
                <CheckCircleIcon />
              )}
              <p className={`text-sm ${vecError ? 'text-red-700' : 'text-green-700'}`}>
                {vecError || vecStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Import Website Tab */}
      {activeTab === 'website' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-indigo-500">
                <GlobeIcon />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Import from Website</h3>
                  <p className="text-xs text-gray-500">Enter URL to discover pages, then select which ones to import</p>
                </div>

                {/* Step 1: Enter URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    value={scrapeUrl}
                    onChange={(e) => { setScrapeUrl(e.target.value); if (scrapeStep === 'select') { setScrapeStep('url'); setDiscoveredPages([]); } }}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={scrapeStep === 'importing'}
                  />
                </div>

                {/* Step 1: Fetch Pages button */}
                {scrapeStep === 'url' && (
                  <button
                    type="button"
                    onClick={onFetchPages}
                    disabled={!scrapeUrl.trim() || isFetchingPages}
                    className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${scrapeUrl.trim() && !isFetchingPages
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {isFetchingPages ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon />
                        Discovering pages...
                      </span>
                    ) : (
                      'Fetch Pages'
                    )}
                  </button>
                )}

                {/* Step 2: Page selector */}
                {scrapeStep === 'select' && discoveredPages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {discoveredPages.length} pages found
                        {sitemapSource ? ` (via ${sitemapSource})` : ''}
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelectedPages(new Set(discoveredPages.map(p => p.url)))} className="text-xs text-indigo-600 hover:text-indigo-800">
                          Select All
                        </button>
                        <button type="button" onClick={() => setSelectedPages(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {Object.entries(discoveredGroups).map(([group, groupUrls]) => (
                        <div key={group}>
                          <label
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={groupUrls.every(u => selectedPages.has(u))}
                              onChange={() => toggleGroup(group)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded"
                            />
                            <span className="text-xs font-semibold text-gray-700">/{group}</span>
                            <span className="text-xs text-gray-400 ml-auto">{groupUrls.length} pages</span>
                          </label>
                          {groupUrls.slice(0, 20).map((url) => (
                            <label
                              key={url}
                              className="flex items-center gap-2 px-3 py-1.5 pl-7 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPages.has(url)}
                                onChange={() => togglePage(url)}
                                className="w-3 h-3 text-indigo-600 rounded"
                              />
                              <span className="text-xs text-gray-600 truncate">{new URL(url).pathname || '/'}</span>
                            </label>
                          ))}
                          {groupUrls.length > 20 && (
                            <div className="px-3 py-1 pl-7 text-xs text-gray-400">
                              +{groupUrls.length - 20} more pages
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{selectedPages.size} pages selected</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scrapeIngest}
                          onChange={(e) => setScrapeIngest(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span className="text-xs">Train chatbot with content</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={onScrapeSelected}
                      disabled={!botId || selectedPages.size === 0}
                      className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${botId && selectedPages.size > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                      Import {selectedPages.size} Selected Pages
                    </button>
                  </div>
                )}

                {/* Step 3: Importing */}
                {scrapeStep === 'importing' && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <SpinnerIcon />
                    <span className="text-sm text-indigo-600">Importing {selectedPages.size} pages...</span>
                  </div>
                )}

                {!botId && (
                  <p className="text-sm text-amber-600 text-center">Save your chatbot first to enable website import</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(scrapeStatus || scrapeError) && scrapeStep !== 'importing' && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${scrapeError ? 'bg-red-50' : 'bg-green-50'}`}>
              {scrapeError ? (
                <span className="text-red-500">⚠️</span>
              ) : (
                <CheckCircleIcon />
              )}
              <p className={`text-sm ${scrapeError ? 'text-red-700' : 'text-green-700'}`}>
                {scrapeError || scrapeStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Text Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste your content here
            </label>
            <textarea
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              {...form.register("knowledge_base")}
              placeholder="Paste FAQs, documentation, product info, policies, or any other text you want your chatbot to know about..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">{kbLen.toLocaleString()} characters</span>
              <button
                type="button"
                onClick={saveTextareaToVector}
                disabled={!botId || kbLen === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${botId && kbLen > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Save to Chatbot
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {(vecStatus || vecError) && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${vecError ? 'bg-red-50' : 'bg-green-50'}`}>
              {vecError ? (
                <span className="text-red-500">⚠️</span>
              ) : (
                <CheckCircleIcon />
              )}
              <p className={`text-sm ${vecError ? 'text-red-700' : 'text-green-700'}`}>
                {vecError || vecStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Starter Questions Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">Starter Questions</h3>
            <p className="text-sm text-gray-500">Suggested questions shown to users when they open the chat</p>
          </div>
          <span className="text-sm text-gray-400">
            {(form.watch("starter_questions") || []).length}/6
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Add a starter question..."
          />
          <button
            type="button"
            onClick={add}
            disabled={(form.watch("starter_questions") || []).length >= 6}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(form.watch("starter_questions") || []).map((q, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
            >
              <span className="truncate max-w-[200px]">{q}</span>
              <button
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
