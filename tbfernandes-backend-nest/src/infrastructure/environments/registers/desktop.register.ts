import { registerAs } from '@nestjs/config';

export interface DesktopConfig {
  /** Secret of this launch; every request must carry it in X-TBF-Desktop-Token. */
  token: string;
  dataDir: string;
  postgresBin: string;
  parentPid: number | null;
  appVersion: string;
  backupDir: string;
}

export const desktopConfig = registerAs('desktop', (): DesktopConfig => ({
  token: process.env.TBF_DESKTOP_TOKEN ?? '',
  dataDir: process.env.TBF_DATA_DIR ?? '',
  postgresBin: process.env.TBF_PG_BIN ?? '',
  parentPid: process.env.TBF_PARENT_PID
    ? Number(process.env.TBF_PARENT_PID)
    : null,
  appVersion: process.env.TBF_APP_VERSION ?? '',
  backupDir: process.env.TBF_BACKUP_DIR ?? '',
}));
