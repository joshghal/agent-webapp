import { highlightSegments } from "@/lib/client/searchHighlight";

export function Highlighted({ text, words }: { text: string; words: string[] }) {
  return (
    <>
      {highlightSegments(text, words).map((seg, i) =>
        seg.matched ? (
          <mark key={i} className="match">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}
