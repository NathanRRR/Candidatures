"use client";

import { useState } from "react";
import { ApplicationTable, type ApplicationRow } from "./ApplicationTable";
import { KanbanBoard } from "./KanbanBoard";

export function BoardView({ applications }: { applications: ApplicationRow[] }) {
  const [vue, setVue] = useState<"table" | "kanban">("kanban");

  return (
    <div>
      <div className="view-toggle">
        <button onClick={() => setVue("table")} disabled={vue === "table"}>
          Tableau
        </button>
        <button onClick={() => setVue("kanban")} disabled={vue === "kanban"}>
          Kanban
        </button>
      </div>
      {vue === "table" ? (
        <ApplicationTable applications={applications} />
      ) : (
        <KanbanBoard applications={applications} />
      )}
    </div>
  );
}
