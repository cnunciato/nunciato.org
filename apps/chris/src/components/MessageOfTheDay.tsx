import { signal } from "@preact/signals";

type Props = {
    origin: string;
};

export default function MessageOfTheDay({ origin }: Props) {
    const message = signal("⏳");

    async function fetchMessage() {
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (import.meta.env.SSR) {
            const response = await fetch(`${origin}/api/message.json`);
            const data = await response.json();
            return data.message;
        } else if (false) {
            const response = await fetch(`${origin}/api/message.json`);
            const data = await response.json();
            return data.message;
        }
    }

    fetchMessage().then(result => (message.value = result));

    return <span>Message of the day: {message}</span>;
}
