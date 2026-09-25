import type { Metadata } from "next";
import { Lab } from "@/components/lab/Lab";

export const metadata: Metadata = {
  title: "BERT vs JEV Lab",
  description: "Moodify's fine-tuned BERT vs TypeSafe's JEV on the same sentiment task: latency, accuracy, calibration and cost.",
};

export default function LabPage() {
  return <Lab />;
}
