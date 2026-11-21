import { priorityText } from "@/components/shared/priority-badge";
import { goalAreaLabels } from "@/features/goals/types/goal";
import { noteExcerpt } from "@/features/knowledge/lib/note-text";
import type { GraphNode } from "@/features/knowledge/lib/graph";
import { projectStatusLabels } from "@/features/projects/types/project";
import { taskStatusLabels } from "@/features/tasks/types/task";
import { formatShort } from "@/lib/dates";
import type { AppData } from "@/lib/sample-data/store";

export type NodeDetails = {
  description?: string;
  /** Label/value pairs that matter for this type of record. */
  meta: { label: string; value: string }[];
};

/**
 * Summary and type-specific metadata for a graph node, read from the real
 * record. Unknown or deleted records give an empty summary.
 */
export function nodeDetails(data: AppData, node: GraphNode): NodeDetails {
  const id = node.id.slice(node.id.indexOf(":") + 1);
  const meta: NodeDetails["meta"] = [];
  const add = (label: string, value?: string) =>
    value && meta.push({ label, value });

  switch (node.kind) {
    case "goal": {
      const goal = data.goals.find((g) => g.id === id);
      if (!goal) break;
      add("Área", goalAreaLabels[goal.area]);
      add("Prazo", goal.dueDate && formatShort(goal.dueDate));
      if (goal.indicator)
        add(
          goal.indicator.label || "Indicador",
          `${goal.indicator.current ?? 0} de ${goal.indicator.target} ${goal.indicator.unit}`,
        );
      return { description: goal.description || goal.desiredResult, meta };
    }
    case "company": {
      const company = data.companies.find((c) => c.id === id);
      if (!company) break;
      add("Nome fantasia", company.tradeName);
      add("Desde", formatShort(company.startDate));
      add(
        "Projetos",
        String(data.projects.filter((p) => p.companyId === id).length),
      );
      return { description: company.description, meta };
    }
    case "project": {
      const project = data.projects.find((p) => p.id === id);
      if (!project) break;
      const tasks = data.tasks.filter((t) => t.projectId === id);
      add("Status", projectStatusLabels[project.status]);
      add(
        "Tarefas abertas",
        String(
          tasks.filter((t) => t.status !== "done" && t.status !== "canceled")
            .length,
        ),
      );
      add(
        "Concluídas",
        String(tasks.filter((t) => t.status === "done").length),
      );
      add("Prazo", project.dueDate && formatShort(project.dueDate));
      add("Próxima entrega", project.nextDelivery);
      return { description: project.description, meta };
    }
    case "task": {
      const task = data.tasks.find((t) => t.id === id);
      if (!task) break;
      add("Status", taskStatusLabels[task.status]);
      add("Prioridade", priorityText[task.priority]);
      add("Prazo", task.dueDate && formatShort(task.dueDate));
      add("Categoria", task.tag);
      return { description: task.description, meta };
    }
    case "note": {
      const note = data.notes.find((n) => n.id === id);
      if (!note) break;
      add("Atualizada", formatShort(note.updatedAt));
      add("Tags", note.tags.map((t) => `#${t}`).join(" "));
      return {
        description: noteExcerpt(note.body, note.title).slice(0, 220),
        meta,
      };
    }
    case "snippet": {
      const snippet = data.snippets.find((s) => s.id === id);
      if (!snippet) break;
      add("Linguagem", snippet.language);
      return { description: snippet.explanation, meta };
    }
    case "method": {
      const method = data.methods.find((m) => m.id === id);
      if (!method) break;
      add("Passos", String(method.steps.length));
      add("Revisado", formatShort(method.lastReviewed));
      return { description: method.summary, meta };
    }
    case "study": {
      const study = data.studies.find((s) => s.id === id);
      if (!study) break;
      add("Próxima atividade", study.nextActivity);
      add("Prazo", study.dueDate && formatShort(study.dueDate));
      return { description: study.description, meta };
    }
    case "skill": {
      const skill = data.skills.find((s) => s.id === id);
      if (!skill) break;
      add("Nível declarado", `${skill.level} de 5`);
      return { description: skill.evidence, meta };
    }
    case "contact": {
      const contact = data.contacts.find((c) => c.id === id);
      if (!contact) break;
      add("Função", contact.role);
      add("Organização", contact.companyName);
      add(
        "Próximo contato",
        contact.nextContact && formatShort(contact.nextContact),
      );
      return { description: contact.context, meta };
    }
    case "tag":
      return { description: undefined, meta };
  }
  return { meta };
}
