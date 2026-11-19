"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCheck, RefreshCw } from "lucide-react";
import { Popover } from "radix-ui";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/features/notifications/lib/use-notifications";
import type { AppNotification } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationBell() {
  const notifications = useNotifications();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );

  async function allowAlerts() {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value && notifications.enabled) {
          void notifications.reload();
          if ("Notification" in window) setPermission(Notification.permission);
        }
      }}
    >
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={
            notifications.unread
              ? `Notificações: ${notifications.unread} não lidas`
              : "Notificações"
          }
        >
          <Bell />
          {notifications.unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
            >
              {notifications.unread > 99 ? "99+" : notifications.unread}
            </span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          aria-label="Notificações"
          className="z-50 flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md outline-none"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b p-4">
            <h2 className="text-sm font-semibold">Notificações</h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={!notifications.unread || notifications.busy}
              onClick={() => void notifications.markAllRead()}
            >
              <CheckCheck /> Ler todas
            </Button>
          </header>
          {!notifications.enabled ? (
            <p className="p-6 text-sm text-muted-foreground">
              As notificações ficam disponíveis ao conectar à API. Você está no
              modo de exemplo.
            </p>
          ) : notifications.error ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 p-5 text-sm"
            >
              <p>{notifications.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void notifications.reload()}
              >
                <RefreshCw /> Tentar novamente
              </Button>
            </div>
          ) : !notifications.ready ? (
            <p role="status" className="p-6 text-sm text-muted-foreground">
              Carregando notificações…
            </p>
          ) : notifications.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Bell className="size-5 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Tudo em dia</p>
              <p className="text-sm text-muted-foreground">
                Respostas de leads, aprovações e lembretes aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 divide-y overflow-y-auto overscroll-contain">
              {notifications.items.map((item) => (
                <li key={item.id}>
                  <NotificationItem
                    item={item}
                    onOpen={() => {
                      void notifications.markRead(item.id);
                      setOpen(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {notifications.enabled && permission === "default" && (
            <footer className="shrink-0 border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void allowAlerts()}
              >
                <BellRing /> Ativar alertas do navegador
              </Button>
            </footer>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function NotificationItem({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: () => void;
}) {
  const className = cn(
    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]",
    !item.readAt && "bg-accent/40",
  );
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          !item.readAt ? "bg-primary" : "bg-transparent",
        )}
      />
      <span className="flex min-w-0 flex-col gap-1 [overflow-wrap:anywhere]">
        <span className={cn("text-sm", !item.readAt && "font-medium")}>
          {item.title}
        </span>
        {item.body && (
          <span className="line-clamp-3 text-sm text-muted-foreground">
            {item.body}
          </span>
        )}
        <time
          dateTime={item.createdAt}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {dateFormat.format(new Date(item.createdAt))}
        </time>
        {!item.readAt && <span className="sr-only">Não lida</span>}
      </span>
    </>
  );
  return item.href?.startsWith("/") && !item.href.startsWith("//") ? (
    <Link href={item.href} onClick={onOpen} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={className}>
      {content}
    </button>
  );
}
