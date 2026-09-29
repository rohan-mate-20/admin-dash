"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteTeamMember } from "@/lib/teamService";

interface DeleteTeamMemberModalProps {
  member: { id: string; name: string; email: string } | null;
  onClose: () => void;
  onDeleted: (name: string) => void;
  onError: (message: string) => void;
}

export function DeleteTeamMemberModal({ member, onClose, onDeleted, onError }: DeleteTeamMemberModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<{ memberId: string; message: string } | null>(null);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (!member) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [member, deleting, onClose]);

  if (!member) return null;

  async function handleDelete() {
    if (!member || deletingRef.current) return;
    deletingRef.current = true;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteTeamMember(member.id);
      onDeleted(member.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove this team member.";
      setDeleteError({ memberId: member.id, message });
      onError(message);
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !deleting) onClose();
    }}>
      <section aria-labelledby="delete-team-member-title" aria-modal="true" className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" role="dialog">
        <button aria-label="Close confirmation" className="absolute right-4 top-4 rounded p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50" disabled={deleting} onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle aria-hidden="true" size={22} />
        </div>
        <h2 id="delete-team-member-title" className="text-lg font-bold text-gray-900">Delete team member?</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          This removes <strong className="text-gray-900">{member.name}</strong>
          {member.email ? <> ({member.email})</> : null} from the active team. Historical orders and expenses will be retained.
        </p>
        {deleteError?.memberId === member.id && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {deleteError.message}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={deleting} onClick={onClose} type="button">Cancel</button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={deleting} onClick={handleDelete} type="button">
            {deleting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <Trash2 aria-hidden="true" size={16} />}
            {deleting ? "Removing..." : "Delete Member"}
          </button>
        </div>
      </section>
    </div>
  );
}