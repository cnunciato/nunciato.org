import type { FunctionalComponent } from "preact";
import type { Signal } from "@preact/signals";
import { signal } from "@preact/signals";

type Props = {
    origin: string;
};

export default function MessageOfTheDay({ origin }: Props) {
    const message = signal("⏳");

    async function fetchMessage() {
        // Wait a moment, just to test async.
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await fetch(`${origin}/api/message.json`);
        const data = await response.json();

        return data.message;
    }

    fetchMessage().then(result => (message.value = result));

    return <span>Message of the day: {message}</span>;
}
