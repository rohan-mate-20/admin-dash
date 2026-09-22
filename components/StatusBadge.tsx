interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = (): { bg: string; color: string } => {
    switch (status.toLowerCase()) {
      case "delivered":
        return { bg: "#DCFCE7", color: "#16a34a" };
      case "pending":
        return { bg: "#FEF3C7", color: "#d97706" };
      case "out for delivery":
        return { bg: "#DBEAFE", color: "#2563eb" };
      case "packed":
        return { bg: "#EDE9FE", color: "#7c3aed" };
      case "cancelled":
        return { bg: "#FFE4E6", color: "#dc2626" };
      // Team roles
      case "packer":
        return { bg: "#DBEAFE", color: "#1d4ed8" };
      case "delivery":
        return { bg: "#FEF3C7", color: "#b45309" };
      // Inventory
      case "in stock":
        return { bg: "#DCFCE7", color: "#16a34a" };
      case "out of stock":
        return { bg: "#FFE4E6", color: "#dc2626" };
      default:
        return { bg: "#F1F5F9", color: "#475569" };
    }
  };

  const { bg, color } = getStyles();

  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap"
      style={{ backgroundColor: bg, color }}
    >
      {status}
    </span>
  );
}
