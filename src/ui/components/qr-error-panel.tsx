/** @jsxImportSource hono/jsx */

export const QrErrorPanel = ({
  reason,
}: {
  reason: "empty" | "too-long";
}) => {
  const message =
    reason === "empty"
      ? "QR Content cannot be empty. Please enter a URL or some text."
      : "QR Content is too long. The maximum is 2048 bytes (UTF-8).";

  return (
    <div id="qr-result">
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        role="alert"
      >
        <p class="font-sans text-sm font-medium text-red-800">{message}</p>
      </div>
    </div>
  );
};
