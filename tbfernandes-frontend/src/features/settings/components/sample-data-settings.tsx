"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useWorkData, workActions } from "@/lib/sample-data/store";

export function SampleDataSettings() {
  const data = useWorkData();
  const records = Object.values(data).reduce(
    (sum, items) => sum + items.length,
    0,
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {records} registros ({data.tasks.length} tarefas, {data.notes.length}{" "}
        notas, {data.goals.length} metas e mais) ficam guardados neste navegador
        enquanto a API não estiver ligada.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <RotateCcw /> Restaurar dados de exemplo
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar dados de exemplo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tudo que você criou ou alterou neste navegador será substituído
              pelos dados de exemplo originais em todos os módulos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                workActions.reset();
                toast.success("Dados de exemplo restaurados");
              }}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
