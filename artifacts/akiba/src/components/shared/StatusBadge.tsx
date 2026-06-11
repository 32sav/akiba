import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  let colorClass = "bg-gray-100 text-gray-800";
  
  switch (status.toLowerCase()) {
    case "completed":
    case "active":
    case "repaid":
      colorClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      break;
    case "pending":
      colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      break;
    case "failed":
    case "defaulted":
      colorClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      break;
  }

  return (
    <Badge variant="outline" className={`font-medium capitalize ${colorClass}`}>
      {status}
    </Badge>
  );
}
