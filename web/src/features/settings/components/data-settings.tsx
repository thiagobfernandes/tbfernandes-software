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
    setProgress("Starting…");
    try {
      const result: ImportResult = await importIntoApi(source, (done, total) =>
        setProgress(`${done} of ${total}`),
      );
      const message = `${result.created} records imported, ${result.skipped} already existed`;
      if (result.failed.length) {
        toast.warning(message, {
          description: `${result.failed.length} could not be imported. First: ${result.failed[0]}`,
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
      toast.error("That file is not a TBFernandes export");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {api ? (
        <p className="text-sm text-muted-foreground">
          Connected to the API at <code>{env.apiUrl}</code>
          {status.state === "ready" &&
            (status.mode === "session"
              ? ", signed in."
              : ", without login (local development).")}
        </p>
      ) : (
        <SampleDataSettings />
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadExport(data)}>
          <Download /> Export JSON
        </Button>
        {api && (
          <>
            <Button
              variant="outline"
              disabled={Boolean(progress)}
              onClick={() => fileInput.current?.click()}
            >
              <Upload /> Import JSON file
            </Button>
            {browserData && (
              <Button
                variant="outline"
                disabled={Boolean(progress)}
                onClick={() => void runImport(browserData)}
              >
                <Upload /> Import data saved in this browser
              </Button>
            )}
            {status.state === "ready" && status.mode === "session" && (
              <Button variant="ghost" onClick={() => void signOut()}>
                <LogOut /> Sign out
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
          Importing: {progress}
        </p>
      )}
      {api && (
        <p className="text-xs text-muted-foreground">
          Import keeps the ids, so records that already exist are skipped and
          importing twice creates nothing new.
        </p>
      )}
    </div>
  );
}
