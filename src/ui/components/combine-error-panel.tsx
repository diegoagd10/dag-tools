/** @jsxImportSource hono/jsx */

export const CombineErrorPanel = ({
  filename,
  reason,
}: {
  filename: string;
  reason: "encrypted" | "corrupt";
}) => {
  const message =
    reason === "encrypted"
      ? `"${filename}" is password-protected and cannot be combined. Remove the file and try again.`
      : `"${filename}" is corrupt or unreadable and cannot be combined. Remove the file and try again.`;

  return (
    <div id="combine-result">
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        role="alert"
      >
        <p class="font-sans text-sm font-medium text-red-800">
          {message}
        </p>
      </div>
    </div>
  );
};
