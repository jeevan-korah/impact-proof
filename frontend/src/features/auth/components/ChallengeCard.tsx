import { Challenge } from "@/types/challenge.types";
import { Link } from "react-router-dom";

interface Props {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: Props) {
  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className="block bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition"
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold">
          {challenge.title}
        </h2>

        <span className="text-xs bg-slate-800 px-2 py-1 rounded">
          {challenge.difficulty}
        </span>
      </div>

      <p className="text-sm text-slate-400 mt-2 line-clamp-2">
        {challenge.description}
      </p>

      <div className="mt-4 text-sm text-slate-300 flex justify-between">
        <span>Baseline: {challenge.baselineValue}</span>
        <span>Target: {challenge.targetValue}</span>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {challenge.vertical} • {challenge.source}
      </div>
    </Link>
  );
}