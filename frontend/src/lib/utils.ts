import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getScoreBadgeColor(score: number | null): string {
  if (score === null) return "bg-gray-100 text-gray-600";
  if (score >= 75) return "bg-green-100 text-green-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return "Not Qualified";
  if (score >= 75) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "qualified":
      return "bg-green-100 text-green-700";
    case "disqualified":
      return "bg-red-100 text-red-700";
    case "contacted":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
