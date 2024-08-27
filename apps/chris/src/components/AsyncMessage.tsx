import { signal } from "@preact/signals";

export default function AsyncMessage() {
    const message = signal("");

    async function fetchMessage() {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch(`/api/message.json`);
        const data = await response.json();
        return data.message;
    }

    fetchMessage().then(result => (message.value = result));

    return <span>Message of the day: {message}</span>;
}
