import { createWriteStream, WriteStream } from 'node:fs';
import { crc32, deflateRawSync } from 'node:zlib';

interface Entry {
  name: Buffer;
  crc: number;
  compressed: number;
  size: number;
  offset: number;
  time: number;
  date: number;
}

const UTF8_NAMES = 0x0800;
const DEFLATE = 8;
const MAX_32 = 0xffffffff;

/** MS-DOS time and date fields of a zip entry, in local time. */
function dos(at: Date): { time: number; date: number } {
  return {
    time:
      (at.getHours() << 11) |
      (at.getMinutes() << 5) |
      Math.floor(at.getSeconds() / 2),
    date:
      ((at.getFullYear() - 1980) << 9) |
      ((at.getMonth() + 1) << 5) |
      at.getDate(),
  };
}

/**
 * A plain zip file written entry by entry (deflate, UTF-8 names), enough for the desktop
 * backup, which any zip tool opens. Each file is read whole, so no entry may pass 4 GiB
 * (PostgreSQL splits tables in 1 GiB segments); the whole archive is limited to 4 GiB too.
 */
export class ZipWriter {
  private readonly out: WriteStream;
  private readonly entries: Entry[] = [];
  private offset = 0;

  constructor(path: string) {
    this.out = createWriteStream(path);
  }

  async add(name: string, content: Buffer, modified: Date): Promise<void> {
    const data = deflateRawSync(content);
    const entry: Entry = {
      name: Buffer.from(name, 'utf8'),
      crc: crc32(content),
      compressed: data.length,
      size: content.length,
      offset: this.offset,
      ...dos(modified),
    };
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(UTF8_NAMES, 6);
    header.writeUInt16LE(DEFLATE, 8);
    header.writeUInt16LE(entry.time, 10);
    header.writeUInt16LE(entry.date, 12);
    header.writeUInt32LE(entry.crc, 14);
    header.writeUInt32LE(entry.compressed, 18);
    header.writeUInt32LE(entry.size, 22);
    header.writeUInt16LE(entry.name.length, 26);
    header.writeUInt16LE(0, 28);
    await this.write(Buffer.concat([header, entry.name, data]));
    this.entries.push(entry);
  }

  /** Writes the central directory and closes the file. */
  async close(): Promise<void> {
    const start = this.offset;
    for (const e of this.entries) {
      const record = Buffer.alloc(46);
      record.writeUInt32LE(0x02014b50, 0);
      record.writeUInt16LE(20, 4);
      record.writeUInt16LE(20, 6);
      record.writeUInt16LE(UTF8_NAMES, 8);
      record.writeUInt16LE(DEFLATE, 10);
      record.writeUInt16LE(e.time, 12);
      record.writeUInt16LE(e.date, 14);
      record.writeUInt32LE(e.crc, 16);
      record.writeUInt32LE(e.compressed, 20);
      record.writeUInt32LE(e.size, 24);
      record.writeUInt16LE(e.name.length, 28);
      record.writeUInt32LE(e.offset, 42);
      await this.write(Buffer.concat([record, e.name]));
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(this.offset - start, 12);
    end.writeUInt32LE(start, 16);
    await this.write(end);
    await new Promise<void>((resolve, reject) =>
      this.out.end((error?: Error | null) =>
        error ? reject(error) : resolve(),
      ),
    );
  }

  /** Stops writing without the central directory, after a failure. */
  abort(): void {
    this.out.destroy();
  }

  private write(chunk: Buffer): Promise<void> {
    if (this.offset + chunk.length > MAX_32 || this.entries.length >= 0xffff) {
      return Promise.reject(new Error('Backup too large for a plain zip file'));
    }
    this.offset += chunk.length;
    return new Promise((resolve, reject) =>
      this.out.write(chunk, (error) => (error ? reject(error) : resolve())),
    );
  }
}
