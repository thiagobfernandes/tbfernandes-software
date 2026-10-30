"use client";

import { useRef, useState } from "react";
import { Download, LogOut, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SampleDataSettings } from "@/features/settings/components/sample-data-settings";
import { signOut, useRemoteStatus } from "@/lib/api/remote-store";
import {
  downloadExport,
  importIntoApi,
  parseExport,
  readBrowserData,
  type ImportResult,
} from "@/lib/api/transfer";
import { env } from "@/lib/env";
import { useAppData } from "@/lib/sample-data/store";

/** Where the data lives, plus export (IDN-04) and import (IDN-05). */
export function DataSettings() {
  const data = useAppData();
  const status = useRemoteStatus();
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string>();
  const api = env.dataSource === "api";
  const browserData = api ? readBrowserData() : undefined;

  async function runImport(source: ReturnType<typeof parseExport>) {
    setProgress("Iniciando…");
    try {
      const result: ImportResult = await importIntoApi(source, (done, total) =>
        setProgress(`${done} de ${total}`),
      );
      const message = `${result.created} registros importados, ${result.skipped} já existiam`;
      if (result.failed.length) {
        toast.warning(message, {
          description: `${result.failed.length} não puderam ser importados. Primeiro: ${result.failed[0]}`,
        });
      } else {
        toast.success(message);
      }
    } finally {
      setProgress(undefined);
    }
  }

  async function importFile(file: File) {
    try {
      await runImport(parseExport(await file.text()));
    } catch {
      toast.error("Esse arquivo não é uma exportação do TBFernandes");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {api ? (
        <p className="text-sm text-muted-foreground">
          Conectado à API em <code>{env.apiUrl}</code>
          {status.state === "ready" &&
            (status.mode === "session"
              ? ", com login."
              : ", sem login (desenvolvimento local).")}
        </p>
      ) : (
        <SampleDataSettings />
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadExport(data)}>
          <Download /> Exportar JSON
        </Button>
        {api && (
          <>
            <Button
              variant="outline"
              disabled={Boolean(progress)}
              onClick={() => fileInput.current?.click()}
            >
              <Upload /> Importar arquivo JSON
            </Button>
            {browserData && (
              <Button
                variant="outline"
                disabled={Boolean(progress)}
                onClick={() => void runImport(browserData)}
              >
                <Upload /> Importar dados salvos neste navegador
              </Button>
            )}
            {status.state === "ready" && status.mode === "session" && (
              <Button variant="ghost" onClick={() => void signOut()}>
                <LogOut /> Sair
              </Button>
            )}
          </>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importFile(file);
          }}
        />
      </div>
      {progress && (
        <p role="status" className="text-sm text-muted-foreground">
          Importando: {progress}
        </p>
      )}
      {api && (
        <p className="text-xs text-muted-foreground">
          A importação mantém os ids: registros que já existem são ignorados e
          importar duas vezes não cria nada novo.
        </p>
      )}
    </div>
  );
}
