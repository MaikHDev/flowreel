import Link from "next/link";

export default function Nav() {

    return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white">
        <div className="flex-1 text-left font-bold">
            <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                Left Button
            </button>
        </div>
        <div className="flex-1 text-center font-semibold">
            <h1>Flow Reel</h1>
        </div>
        <div className="flex-1 text-right">
           <Link
                href={"/messages"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
                Messages
            </Link>
        </div>
    </nav>
    );
}

