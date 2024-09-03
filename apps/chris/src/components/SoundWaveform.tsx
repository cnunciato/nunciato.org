type Props = {
    data: number[];
    percentComplete: number;
};

export default function Sound({ data = [], percentComplete = 0 }: Props) {
    return (
        <div>
            <div class="relative h-56 w-full">
                <ol class="z-0 absolute flex w-full justify-evenly items-center top-0 right-0 bottom-0 left-0">
                    {data.map(v => (
                        <li
                            class="bg-neutral-700"
                            style={`height: ${v * 100}%; width: ${100 / data.length}%;`}
                        ></li>
                    ))}
                </ol>
                <div
                    class="absolute z-10 bg-neutral-200 rounded-lg opacity-50 top-0 right-0 bottom-0 left-0 transition-all"
                    style={`width: ${percentComplete}%`}
                ></div>
            </div>
        </div>
    );
}
