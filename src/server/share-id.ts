import { nanoid } from "nanoid";

export function newShareId(): string {
  return nanoid(12);
}
