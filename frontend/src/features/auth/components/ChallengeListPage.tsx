import { useQuery } from "@tanstack/react-query";
import { getChallenges } from "@/api/challenges.api";
import ChallengeCard from "../components/ChallengeCard";

export default function ChallengeListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => getChallenges({ status: "open" }),
  });

  if (isLoading) {
    return <div className="p-6">Loading challenges...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-red-400">
        Failed to load challenges.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Open Challenges
      </h1>

      {data?.length === 0 && (
        <div className="text-slate-400">
          No challenges available.
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
          />
        ))}
      </div>
    </div>
  );
}