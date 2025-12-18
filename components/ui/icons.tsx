import { cn } from "@/lib/utils";

export function Tick({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      data-testid="tick-icon"
    >
      <path
        d="M3.33334 8.66669L6.00001 11.3334L12.6667 4.66669"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function XMark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M6.75729 17.2426L11.9999 12M17.2426 6.75736L11.9999 12M11.9999 12L6.75729 6.75736M11.9999 12L17.2426 17.2426"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function ArrowDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.5 6.75L9 11.25L13.5 6.75"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Success({ className }: { className?: string }) {
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6 text-success-600", className)}
    >
      <rect x="0.5" width="24" height="24" rx="12" fill="currentColor" />
      <rect
        opacity="0.2"
        x="0.5"
        width="24"
        height="24"
        rx="12"
        fill="url(#paint0_radial_success)"
      />
      <rect
        x="0.636364"
        y="0.136364"
        width="23.7273"
        height="23.7273"
        rx="11.8636"
        stroke="url(#paint1_linear_success)"
        strokeWidth="0.272727"
      />
      <path
        d="M8.54541 12.4091L10.7272 14.5909L16.1818 9.13633"
        stroke="white"
        strokeWidth="1.5"
      />
      <defs>
        <radialGradient
          id="paint0_radial_success"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(5.95455) rotate(63.4349) scale(26.8328 26.7171)"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint1_linear_success"
          x1="12.5"
          y1="0"
          x2="12.5"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Fail({ className }: { className?: string }) {
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6 text-error-600", className)}
    >
      <rect x="0.5" width="24" height="24" rx="12" fill="currentColor" />
      <rect
        opacity="0.2"
        x="0.5"
        width="24"
        height="24"
        rx="12"
        fill="url(#paint0_radial_fail)"
      />
      <rect
        x="0.636364"
        y="0.136364"
        width="23.7273"
        height="23.7273"
        rx="11.8636"
        stroke="url(#paint1_linear_fail)"
        strokeWidth="0.272727"
      />
      <path
        d="M9.50403 14.7233L12.3637 11.8636M15.2233 9.00403L12.3637 11.8636M12.3637 11.8636L9.50403 9.00403M12.3637 11.8636L15.2233 14.7233"
        stroke="white"
        strokeWidth="1.5"
      />
      <defs>
        <radialGradient
          id="paint0_radial_fail"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(5.95455) rotate(63.4349) scale(26.8328 26.7171)"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint1_linear_fail"
          x1="12.5"
          y1="0"
          x2="12.5"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MagicWand({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <path
        d="M14.0774 3.8389L3.82886 14.0874L4.48362 14.7421L5.25751 15.516L5.91227 16.1707L16.1607 5.92225L15.506 5.26752L14.7321 4.49363L14.0774 3.8389Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.2844 6.63257L13.3678 8.7159"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2313 3.98142C10.6148 3.98142 10.9258 3.6705 10.9258 3.28697C10.9258 2.90344 10.6148 2.59253 10.2313 2.59253C9.84778 2.59253 9.53687 2.90344 9.53687 3.28697C9.53687 3.6705 9.84778 3.98142 10.2313 3.98142Z"
        fill="currentColor"
      />
      <path
        d="M6.87508 3.125L7.43777 4.64564L8.95841 5.20833L7.43777 5.77102L6.87508 7.29167L6.31239 5.77102L4.79175 5.20833L6.31239 4.64564L6.87508 3.125Z"
        fill="currentColor"
      />
      <path
        d="M15 10.8333L15.6752 12.658L17.5 13.3333L15.6752 14.0085L15 15.8333L14.3248 14.0085L12.5 13.3333L14.3248 12.658L15 10.8333Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Clear({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
    >
      <path
        d="M6.75729 17.2426L11.9999 12M17.2426 6.75736L11.9999 12M11.9999 12L6.75729 6.75736M11.9999 12L17.2426 17.2426"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
