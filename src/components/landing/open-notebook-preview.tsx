import type { CSSProperties } from "react";

const studentNotes = [
  "I like presenting ideas and making complicated things clearer.",
  "I want creative work, but I do not want to work alone all day.",
  "I am still unsure how much technology I want in my future.",
] as const;

export const notebookRoles = [
  "UX researcher",
  "Exhibition designer",
  "Science writer",
  "Instructional designer",
  "Creative producer",
  "Program coordinator",
  "Content designer",
] as const;

export function OpenNotebookPreview() {
  return (
    <figure
      aria-label="An open notebook showing student notes beside a sample of unranked career roles"
      className="open-notebook"
    >
      <section aria-labelledby="student-notes-title" className="notebook-page notebook-page--left">
        <div className="notebook-page__number" aria-hidden="true">
          What I know
        </div>
        <h2 id="student-notes-title">A few things about me</h2>
        <ul className="notebook-notes">
          {studentNotes.map((note, index) => (
            <li className="notebook-note" key={note} style={{ "--note-index": index } as CSSProperties}>
              {note}
            </li>
          ))}
        </ul>
        <p className="notebook-margin-note">This is enough to begin.</p>
      </section>

      <section aria-labelledby="notebook-roles-title" className="notebook-page notebook-page--right">
        <div className="notebook-page__number" aria-hidden="true">
          What could fit
        </div>
        <h2 id="notebook-roles-title">Roles worth opening</h2>
        <p className="notebook-page__intro">A sample from a larger unranked set.</p>
        <ul className="notebook-roles">
          {notebookRoles.map((role, index) => (
            <li
              className={role === "Exhibition designer" ? "notebook-role notebook-role--selected" : "notebook-role"}
              key={role}
              style={{ "--role-index": index } as CSSProperties}
            >
              {role}
            </li>
          ))}
        </ul>
        <div className="notebook-role-note">
          <strong>Exhibition designer</strong>
          <span>Shapes how people experience stories, objects, and ideas in physical spaces.</span>
        </div>
      </section>

      <figcaption className="sr-only">
        Steppi starts with the student&apos;s own words and opens them into several career roles to explore.
      </figcaption>
    </figure>
  );
}
