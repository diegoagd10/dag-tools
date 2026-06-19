import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Storage {
  path(id: string, ext: string): string;
  write(id: string, ext: string, data: Uint8Array): Promise<string>;
  read(id: string, ext: string): Promise<Uint8Array>;
}

export function createStorage(storageDir: string): Storage {
  return {
    path(id, ext) {
      return join(storageDir, `${id}.${ext}`);
    },
    async write(id, ext, data) {
      await mkdir(storageDir, { recursive: true });
      const filePath = join(storageDir, `${id}.${ext}`);
      await writeFile(filePath, data);
      return filePath;
    },
    async read(id, ext) {
      return readFile(join(storageDir, `${id}.${ext}`));
    },
  };
}
