import { useParams, useNavigate } from "react-router-dom";
import { issues } from "@/data/issues";
import IssuePage from "../components/common/Issuepage";

export default function IssueChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-white text-lg font-semibold">Issue not found: {id}</p>
        <button onClick={() => navigate("/")} className="text-sm text-accent underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <IssuePage issue={issue} />;
}