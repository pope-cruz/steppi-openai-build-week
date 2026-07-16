import { BRANCH_LABELS } from "@/lib/product";

const paths = [
  {
    label: BRANCH_LABELS[0],
    title: "A path that builds on what you know",
    className: "path-node--blue",
  },
  {
    label: BRANCH_LABELS[1],
    title: "A nearby direction worth comparing",
    className: "path-node--peach",
  },
  {
    label: BRANCH_LABELS[2],
    title: "A possibility you may not have seen yet",
    className: "path-node--green",
  },
];

export function PathPreview() {
  return (
    <figure
      aria-label="A preview showing one student connected to three equally weighted exploration paths"
      className="path-preview"
    >
      <div aria-hidden="true" className="path-preview__wash" />
      <svg
        aria-hidden="true"
        className="path-preview__edges"
        preserveAspectRatio="none"
        viewBox="0 0 620 520"
      >
        <path d="M310 262 C250 220 207 144 152 105" />
        <path d="M310 262 C374 206 415 134 475 100" />
        <path d="M310 262 C367 316 401 398 474 430" />
      </svg>

      <div className="student-node">
        <span className="student-node__label">Start with</span>
        <strong>You</strong>
        <span>What matters now</span>
      </div>

      <div className="path-node path-node--one path-node--blue">
        <span>{paths[0].label}</span>
        <strong>{paths[0].title}</strong>
      </div>
      <div className="path-node path-node--two path-node--peach">
        <span>{paths[1].label}</span>
        <strong>{paths[1].title}</strong>
      </div>
      <div className="path-node path-node--three path-node--green">
        <span>{paths[2].label}</span>
        <strong>{paths[2].title}</strong>
      </div>

      <figcaption>
        One starting point. Three different directions to question and compare.
      </figcaption>
    </figure>
  );
}
