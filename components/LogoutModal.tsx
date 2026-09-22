"use client";

import { LogOut } from "lucide-react";
import { Modal } from "./Modal";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const handleLogout = () => {
    // In a real app this would clear auth tokens and redirect
    console.log("User logged out");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center flex flex-col items-center pt-4">
        <div className="w-16 h-16 bg-red/10 text-red rounded-full flex items-center justify-center mb-6">
          <LogOut size={32} className="ml-1" />
        </div>
        
        <h2 className="text-xl font-bold text-text-main mb-2">
          Are you sure you want to log out?
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          You will be signed out of your admin account.
        </p>

        <div className="flex gap-4 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-200 text-text-main font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 py-3 px-4 bg-red text-white font-semibold rounded-lg hover:bg-red/90 transition-colors shadow-sm"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </Modal>
  );
}
