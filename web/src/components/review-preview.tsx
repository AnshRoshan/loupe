"use client";
import { useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  FileCode2,
  GitPullRequest,
  MessageSquare,
  ScanEye,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
  X,
} from "lucide-react";
const examples = [
  {
    label: "Catch bugs",
    file: "src/api/users.ts",
    title: "Handle an empty result before accessing the user",
    description:
      "findUnique() can return null. Without a guard, this request throws instead of returning a helpful 404.",
    lines: [
      { n: 24, text: "export async function getUser(id: string) {" },
      { n: 25, text: "  const user = await db.user.findUnique({", kind: "add" },
      { n: 26, text: "    where: { id },", kind: "add" },
      { n: 27, text: "  });", kind: "add" },
      { n: 28, text: "  return user.name;", kind: "remove" },
      { n: 29, text: "}" },
    ],
    fix: "  if (!user) return notFound();",
    severity: "Potential bug",
  },
  {
    label: "Find risks",
    file: "src/api/search.ts",
    title: "Keep user input out of the SQL query",
    description:
      "Interpolating a search term can allow SQL injection. Bind the value as a parameter instead.",
    lines: [
      { n: 12, text: "export async function search(term: string) {" },
      { n: 13, text: "  const query = `SELECT * FROM users", kind: "add" },
      { n: 14, text: "    WHERE name = '${term}'`;", kind: "remove" },
      { n: 15, text: "  return db.execute(query);", kind: "add" },
      { n: 16, text: "}" },
    ],
    fix: '  return db.query("SELECT * FROM users WHERE name = $1", [term]);',
    severity: "Security risk",
  },
  {
    label: "Reduce noise",
    file: "src/lib/cache.ts",
    title: "Only the findings worth your attention",
    description:
      "This change handles a missing cache entry explicitly. No actionable issue in this example. Keep shipping.",
    lines: [
      { n: 8, text: "export async function cachedValue(key: string) {" },
      { n: 9, text: "  const cached = await cache.get(key);", kind: "add" },
      { n: 10, text: "  if (cached !== null) return cached;", kind: "add" },
      { n: 11, text: "  return fetchFreshValue(key);", kind: "add" },
      { n: 12, text: "}" },
    ],
    fix: "",
    severity: "Looking good",
  },
];
export function ReviewPreview() {
  const [tab, setTab] = useState(0);
  const [applied, setApplied] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const example = examples[tab];
  return (
    <div className="review-scene">
      <div className="scene-orbit orbit-one" />
      <div className="scene-orbit orbit-two" />
      <div className="review-top-label">
        <span className="tiny-avatar">a</span>
        <span>
          anshace / <b>awesome-project</b>
        </span>
        <span className="sample-label">Interactive example</span>
      </div>
      <div className="review-window">
        <div className="review-window-header">
          <div className="pr-icon">
            <GitPullRequest size={17} />
          </div>
          <div>
            <b>Make the user experience a little better</b>
            <p>
              #142 <span>opened just now</span>
            </p>
          </div>
          <span className="open-badge">Open</span>
        </div>
        <div className="review-file">
          <FileCode2 size={14} />
          <span>{example.file}</span>
          <span className="diff-stats">
            +4 <i>−1</i>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="code-lines">
          {example.lines.map((line, i) => (
            <div
              key={`${tab}-${i}`}
              className={`code-line ${line.kind || ""} ${applied && line.kind === "remove" ? "resolved-line" : ""}`}
            >
              <span className="line-number">{line.n}</span>
              <span className="line-marker">
                {line.kind === "add" ? "+" : line.kind === "remove" ? "−" : ""}
              </span>
              <code>
                {applied && line.kind === "remove" ? example.fix : line.text}
              </code>
            </div>
          ))}
        </div>
        <div className="review-comment">
          <div className="comment-author">
            <span className="comment-logo">
              <ScanEye size={17} />
            </span>
            <b>loupe</b>
            <span className="bot-label">bot</span>
            <span className="comment-time">just now</span>
            <span
              className={tab === 2 || applied ? "severity success" : "severity"}
            >
              {tab === 2 || applied ? (
                <Check size={11} />
              ) : (
                <TriangleAlert size={11} />
              )}{" "}
              {applied ? "Resolved" : example.severity}
            </span>
          </div>
          <h4>{example.title}</h4>
          <p>{example.description}</p>
          {example.fix && (
            <>
              <div className="suggestion-label">
                <Sparkles size={12} /> Suggested change
              </div>
              <div className="suggestion-code">
                <span>+</span>
                <code>{example.fix}</code>
              </div>
            </>
          )}
          <div className="comment-bottom">
            {example.fix ? (
              <button
                onClick={() => setApplied(!applied)}
                className={applied ? "apply-button applied" : "apply-button"}
              >
                {applied ? <CheckCheck size={12} /> : <Check size={12} />}{" "}
                {applied ? "Applied to example" : "Apply suggestion"}
              </button>
            ) : (
              <span className="clean-result">
                <ShieldCheck size={14} /> No changes needed
              </span>
            )}
            <button
              className={`helpful-button ${helpful ? "is-helpful" : ""}`}
              onClick={() => setHelpful(!helpful)}
              aria-label="Mark example helpful"
              aria-pressed={helpful}
            >
              <ThumbsUp size={13} />
              {helpful ? "Helpful" : "1"}
            </button>
          </div>
        </div>
        <div className="window-footer">
          <span>
            <CheckCheck size={14} /> Review complete
          </span>
          <span>Context, not just code.</span>
        </div>
      </div>
      <div className="review-floating">
        <span className="floating-check">
          <ShieldCheck size={20} />
        </span>
        <div>
          <b>A little more confidence.</b>
          <span>Before you hit merge.</span>
        </div>
        <Sparkles size={18} />
      </div>
      <div className="preview-tabs" role="tablist" aria-label="Review examples">
        {examples.map((item, i) => (
          <button
            key={item.label}
            role="tab"
            aria-selected={tab === i}
            className={tab === i ? "active" : ""}
            onClick={() => {
              setTab(i);
              setApplied(false);
              setHelpful(false);
            }}
          >
            {i === 0 ? (
              <Code2 size={14} />
            ) : i === 1 ? (
              <ShieldCheck size={14} />
            ) : (
              <MessageSquare size={14} />
            )}{" "}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
