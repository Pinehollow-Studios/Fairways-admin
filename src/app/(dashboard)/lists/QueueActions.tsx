"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveList, rejectList } from "./actions";

type Props = { listId: string; listName: string };

export function QueueActions({ listId, listName }: Props) {
  const [pending, startTransition] = useTransition();

  function run(verb: "approve" | "reject") {
    startTransition(async () => {
      const result =
        verb === "approve" ? await approveList(listId) : await rejectList(listId);
      if (result.ok) {
        toast.success(
          verb === "approve" ? `Verified "${listName}"` : `Rejected "${listName}"`,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("reject")}
      >
        Reject
      </Button>
      <Button size="sm" disabled={pending} onClick={() => run("approve")}>
        Approve
      </Button>
    </div>
  );
}
