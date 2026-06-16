export default function AppIconMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="112" fill="#0A0A0A" />
      <g transform="translate(0, 20)">
        <text
          x="35"
          y="365"
          fill="#4B5563"
          fontSize="360"
          fontWeight="900"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          letterSpacing="-0.08em"
        >
          S
        </text>
        <text
          x="255"
          y="365"
          fill="#34d399"
          fontSize="360"
          fontWeight="900"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          filter="drop-shadow(0px 0px 20px rgba(52, 211, 153, 0.5))"
        >
          P
        </text>
      </g>
    </svg>
  );
}
