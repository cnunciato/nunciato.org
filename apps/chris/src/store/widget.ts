// import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

export const selected = persistentAtom<string>("selected", "false");
