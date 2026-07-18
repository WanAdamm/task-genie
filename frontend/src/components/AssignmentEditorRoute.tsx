import Assignment from "@/pages/Assignment";
import { useParams } from "react-router-dom";

export default function AssignmentEditorRoute() {
  const { planId } = useParams();
  return <Assignment key={planId ?? "new"} />;
}
