import React, { useEffect, useRef } from "react";
import { MatchState } from "../matchTypes";

interface Props {
  state: MatchState;
}

type FilterType = "all" | "fours" | "sixes" | "wickets";

export default function Commentary({ state }: Props) {
  const [filter, setFilter] = React.useState<FilterType>("all");
  const commentaryEndRef = useRef<HTMLDivElement>(null);

  const allComments = [...state.commentary].reverse();

  const filteredComments = allComments.filter((comment) => {
    if (filter === "all") return true;
    const text = comment.text.toLowerCase();
    if (filter === "fours") return text.includes("four") || text.includes("boundary");
    if (filter === "sixes") return text.includes("six");
    if (filter === "wickets") return text.includes("wicket") || text.includes("out");
    return true;
  });

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.commentary.length]);

  return (
    <div className="p-4 text-white pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Commentary</h2>
        <div className="text-sm text-gray-400">
          {filteredComments.length} {filteredComments.length === 1 ? "entry" : "entries"}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors btn-press ${
            filter === "all"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("fours")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors btn-press ${
            filter === "fours"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          🏏 Fours
        </button>
        <button
          onClick={() => setFilter("sixes")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors btn-press ${
            filter === "sixes"
              ? "bg-yellow-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          ⚡ Sixes
        </button>
        <button
          onClick={() => setFilter("wickets")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors btn-press ${
            filter === "wickets"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          🔴 Wickets
        </button>
      </div>

      {filteredComments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          {filter === "all"
            ? "No commentary yet. Add comments after each delivery in the Live Score tab."
            : `No ${filter} found in commentary.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredComments.map((comment, idx) => (
            <div
              key={idx}
              className={`p-3 rounded ${
                comment.auto ? "bg-gray-800" : "bg-slate-700"
              }`}
            >
              <span className="text-gray-400 font-semibold">
                Over {comment.over}.{comment.ball}
              </span>
              <span className="mx-2">–</span>
              <span className="text-white">{comment.text}</span>
            </div>
          ))}
          <div ref={commentaryEndRef} />
        </div>
      )}
    </div>
  );
}
