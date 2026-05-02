import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  href: string;
  title: string;
  description: string;
  count?: number;
  status: "live" | "soon";
};

export function QueueTile({ href, title, description, count, status }: Props) {
  const body = (
    <Card className="h-full transition-colors hover:border-foreground/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {status === "soon" ? (
            <Badge variant="secondary">Soon</Badge>
          ) : (
            count !== undefined && (
              <Badge variant={count > 0 ? "default" : "outline"}>{count}</Badge>
            )
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {status === "live" ? "Open queue →" : "Wires up when the iOS feature lands."}
      </CardContent>
    </Card>
  );

  if (status === "soon") return body;
  return <Link href={href}>{body}</Link>;
}
