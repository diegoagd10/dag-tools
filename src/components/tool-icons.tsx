type ToolIconVariant = "pdf";

interface ToolIconProps {
  variant?: ToolIconVariant;
  className?: string;
}

export function ToolIcon({ variant = "pdf", className }: ToolIconProps) {
  switch (variant) {
    case "pdf":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="10" y="14" width="26" height="30" rx="2" />
          <rect x="14" y="10" width="26" height="30" rx="2" />
          <rect x="18" y="6" width="26" height="30" rx="2" />
        </svg>
      );
    default:
      return null;
  }
}
