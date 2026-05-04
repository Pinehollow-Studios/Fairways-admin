"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
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
        className="border-alert/30 text-alert hover:bg-alert/10 hover:text-alert"
      >
        <X className="size-3.5" />
        Reject
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run("approve")}
        className="bg-brand text-brand-fg hover:bg-brand-deep"
      >
        <Check className="size-3.5" />
        Approve
      </Button>
    </div>
  );
}
