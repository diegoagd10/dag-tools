/** @jsxImportSource hono/jsx */

export const Layout = ({
  children,
  title,
}: {
  children?: unknown;
  title: string;
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/static/styles.css" />
        <script src="/static/vendor/htmx.min.js" defer />
        <script src="/static/vendor/Sortable.min.js" defer />
        <script src="/static/js/combine-form.js" defer />
      </head>
      <body class="min-h-full flex flex-col bg-paper text-ink">
        <main class="mx-auto flex w-full max-w-3xl flex-col px-6 pt-10 pb-24 sm:pt-16">
          {children}
        </main>
      </body>
    </html>
  );
};
