import { signal } from "@preact/signals";

const message = signal("⏳");

try {
    const data = await fetch("/api/message.json").then(response => response.json());
    message.value = data.message;
} catch (error) {}

export default function MessageOfTheDay() {
    return <span>Message of the day: {message.value}</span>;
}
