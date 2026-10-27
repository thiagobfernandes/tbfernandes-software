"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Pencil,
  Plus,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { DotRow, ProgressRing } from "@/components/shared/metric-visuals";
import { PageHeading } from "@/components/shared/page-heading";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EducationFormDialog,
  MaterialFormDialog,
  SkillFormDialog,
  StudyFormDialog,
} from "@/features/learning/components/learning-form-dialogs";
import {
  materialStatusLabels,
  materialStatusOptions,
  materialTypeMeta,
  skillLevelLabels,
  studyStatusLabels,
} from "@/features/learning/components/learning-meta";
import type {
  Education,
  LearningMaterial,
  MaterialStatus,
  Skill,
  Study,
} from "@/features/learning/types/learning";
import { formatShort } from "@/lib/dates";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const consumed = (material: LearningMaterial) =>
  material.status === "consumed" || material.status === "reviewed";

export function LearningPage() {
  const data = useAppData();
  const [tab, setTab] = useState("studies");
  const [editingStudy, setEditingStudy] = useState<Study>();
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial>();
  const [editingSkill, setEditingSkill] = useState<Skill>();
  const [editingEducation, setEditingEducation] = useState<Education>();

  const activeStudies = data.studies.filter(
    (study) => study.status === "in_progress",
  ).length;
  const doneMaterials = data.materials.filter(consumed).length;
  const queue = data.materials.filter(
    (material) => material.status === "to_consume",
  ).length;

  const newButton: Record<string, React.ReactNode> = {
    studies: (
      <StudyFormDialog
        trigger={
          <Button>
            <Plus /> Novo estudo
          </Button>
        }
      />
    ),
    materials: (
      <MaterialFormDialog
        trigger={
          <Button>
            <Plus /> Novo material
          </Button>
        }
      />
    ),
    skills: (
      <SkillFormDialog
        trigger={
          <Button>
            <Plus /> Nova habilidade
          </Button>
        }
      />
    ),
    education: (
      <EducationFormDialog
        trigger={
          <Button>
            <Plus /> Nova formação
          </Button>
        }
      />
    ),
  };

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Aprendizado"
        description="Estudos, os materiais por trás deles e as habilidades que constroem."
        actions={
          <>
            <SampleDataBadge />
            {newButton[tab]}
          </>
        }
      />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Estudos em andamento"
          value={activeStudies}
          unit={`/ ${data.studies.length}`}
          visual={
            <ProgressRing
              value={activeStudies}
              total={data.studies.length || 1}
            />
          }
        />
        <MetricCard
          label="Materiais consumidos"
          value={doneMaterials}
          unit={`/ ${data.materials.length}`}
          visual={
            <ProgressRing
              value={doneMaterials}
              total={data.materials.length || 1}
            />
          }
        />
        <MetricCard
          label="Na fila"
          value={queue}
          unit="a consumir"
          visual={<DotRow active={queue} total={6} />}
        />
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="studies">Estudos</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="education">Formação</TabsTrigger>
        </TabsList>

        <TabsContent value="studies" className="mt-2">
          {data.studies.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nenhum estudo ainda"
              description="Comece um estudo para agrupar materiais em torno de um tema."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {data.studies.map((study) => {
                const materials = data.materials.filter(
                  (material) => material.studyId === study.id,
                );
                const percent = materials.length
                  ? Math.round(
                      (materials.filter(consumed).length / materials.length) *
                        100,
                    )
                  : 0;
                const goal = data.goals.find((g) => g.id === study.goalId);
                const skills = data.skills.filter((skill) =>
                  study.skillIds.includes(skill.id),
                );
                return (
                  <article
                    key={study.id}
                    className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase">
                          {studyStatusLabels[study.status]}
                        </span>
                        <h2 className="font-medium">{study.name}</h2>
                        {study.description && (
                          <p className="text-sm text-muted-foreground">
                            {study.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar estudo"
                          onClick={() => setEditingStudy(study)}
                        >
                          <Pencil />
                        </Button>
                        <ConfirmDelete
                          noun="estudo"
                          name={study.name}
                          onConfirm={() => {
                            dataActions.remove("studies", study.id);
                            toast.success("Estudo excluído");
                          }}
                        />
                      </div>
                    </div>
                    {study.nextActivity && (
                      <div className="rounded-xl border border-l-4 border-l-primary px-3 py-2 text-sm">
                        <span className="text-xs text-muted-foreground">
                          Próxima atividade
                        </span>
                        <p>{study.nextActivity}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {materials.filter(consumed).length}/{materials.length}{" "}
                          materiais consumidos
                        </span>
                        <span className="tabular-nums">{percent}%</span>
                      </div>
                      <ProgressBar
                        value={percent}
                        label={`${study.name} materiais consumidos`}
                      />
                    </div>
                    {skills.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {skills.map((skill) => (
                          <li
                            key={skill.id}
                            className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                      {goal && (
                        <Link
                          href={`/goals/${goal.id}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Target className="size-3.5" aria-hidden />
                          {goal.name}
                        </Link>
                      )}
                      {study.dueDate && (
                        <span className="ml-auto flex items-center gap-1">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {formatShort(study.dueDate)}
                        </span>
                      )}
                    </div>
                    <MaterialFormDialog
                      defaultStudyId={study.id}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus /> Material
                        </Button>
                      }
                    />
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="mt-2">
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Estudo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.materials.map((material) => {
                  const { label, icon: Icon } = materialTypeMeta[material.type];
                  const study = data.studies.find(
                    (item) => item.id === material.studyId,
                  );
                  return (
                    <tr
                      key={material.id}
                      className="border-b last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                            title={label}
                          >
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="truncate">{material.title}</span>
                              {material.url && (
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Abrir ${material.title}`}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {label}
                              {material.notes && ` · ${material.notes}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {study?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={material.status}
                          onValueChange={(value) =>
                            dataActions.update("materials", material.id, {
                              status: value as MaterialStatus,
                            })
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            aria-label={`Status de ${material.title}`}
                            className={cn(
                              "w-36",
                              consumed(material) && "text-success",
                            )}
                          >
                            <SelectValue>
                              {materialStatusLabels[material.status]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {materialStatusOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Editar material"
                            onClick={() => setEditingMaterial(material)}
                          >
                            <Pencil />
                          </Button>
                          <ConfirmDelete
                            noun="material"
                            name={material.title}
                            onConfirm={() =>
                              dataActions.remove("materials", material.id)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-2">
          <ul className="grid gap-3 md:grid-cols-2">
            {[...data.skills]
              .sort((a, b) => b.level - a.level)
              .map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-start gap-4 rounded-2xl border bg-card p-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-medium">{skill.name}</h2>
                      <span className="text-xs text-muted-foreground">
                        {skillLevelLabels[skill.level]}
                      </span>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={`Nível de ${skill.name}`}
                      className="flex gap-1"
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          role="radio"
                          aria-checked={skill.level === level}
                          aria-label={`Nível ${level}: ${skillLevelLabels[level]}`}
                          onClick={() =>
                            dataActions.update("skills", skill.id, { level })
                          }
                          className={cn(
                            "h-2 flex-1 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            level <= skill.level ? "bg-primary" : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {skill.evidence || "Nenhuma evidência registrada ainda."}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar habilidade"
                      onClick={() => setEditingSkill(skill)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      noun="habilidade"
                      name={skill.name}
                      onConfirm={() => dataActions.remove("skills", skill.id)}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </TabsContent>

        <TabsContent value="education" className="mt-2">
          <ul className="flex flex-col gap-3">
            {data.educations.map((education) => (
              <li
                key={education.id}
                className="flex items-start gap-4 rounded-2xl border bg-card p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <GraduationCap className="size-5" aria-hidden />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <h2 className="font-medium">
                    {education.degree} · {education.course}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {education.institution}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {education.startDate.slice(0, 4)} –{" "}
                    {education.endDate?.slice(0, 4) ??
                      (education.status === "in_progress" ? "now" : "paused")}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar formação"
                    onClick={() => setEditingEducation(education)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDelete
                    noun="formação"
                    name={education.course}
                    onConfirm={() =>
                      dataActions.remove("educations", education.id)
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <StudyFormDialog
        item={editingStudy}
        open={Boolean(editingStudy)}
        onOpenChange={(open) => !open && setEditingStudy(undefined)}
      />
      <MaterialFormDialog
        item={editingMaterial}
        open={Boolean(editingMaterial)}
        onOpenChange={(open) => !open && setEditingMaterial(undefined)}
      />
      <SkillFormDialog
        item={editingSkill}
        open={Boolean(editingSkill)}
        onOpenChange={(open) => !open && setEditingSkill(undefined)}
      />
      <EducationFormDialog
        item={editingEducation}
        open={Boolean(editingEducation)}
        onOpenChange={(open) => !open && setEditingEducation(undefined)}
      />
    </PageContainer>
  );
}
