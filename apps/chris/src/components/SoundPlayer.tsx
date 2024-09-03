import { percentComplete } from "../store/sound";

type Props = {
    src: string;
};

function onTime(event: Event) {
    const current = (event.target as HTMLMediaElement).currentTime;
    const duration = (event.target as HTMLMediaElement).duration;

    // console.log("OnTime");

    if (current && duration) {
        const complete = (current / duration) * 100;
        console.log({ complete });
        // percentComplete.set();
        percentComplete.set(complete);
    }
}

export default function Sound({ src }: Props) {
    return (
        <audio
            controls
            class="rounded shadow w-full block mt-2"
            onTimeUpdate={event => onTime(event)}
        >
            <source src={src} />
        </audio>
    );
}
