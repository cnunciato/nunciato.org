import type { Signal } from "@preact/signals";

type Props = {
    count: Signal<number>;
};

export default function Counter({ count }: Props) {
    const add = () => count.value++;
    const subtract = () => count.value--;

    return (
        <div class="counter">
            <button onClick={subtract} className="bg-blue-300">
                -
            </button>
            <pre>{count}</pre>
            <button onClick={add}>+</button>
        </div>
    );
}
