import { useStore } from "@nanostores/preact";
import { selected } from "../store/widget";

export default function Widget() {
    const $selected = useStore(selected);

    console.log($selected);

    let label = "Something";
    if ($selected === "false") {
        label = "Something else";
    }

    return (
        <button
            class="bg-blue-200 p-2 text-white rounded"
            onClick={() => selected.set($selected === "false" ? "true" : "false")}
        >
            {label}
        </button>
    );
}
