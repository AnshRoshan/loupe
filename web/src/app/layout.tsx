import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./workspace.css";
import "./refinements.css";
export const metadata: Metadata = {
  title: {
    default: "Loupe. A closer look. Better code.",
    template: "%s | Loupe",
  },
  description:
    "Your thoughtful, open-source AI code reviewer. Scan repositories, catch risks, and review pull requests with more context and less noise.",
};
// Runs before first paint: picks the persisted theme, else the OS preference.
// data-theme drives the generated CSS variable overrides in globals.css.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("loupe-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
