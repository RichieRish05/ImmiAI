// components/map/SmartPromptModal.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function SmartPromptModal({
  open,
  onClose,
  onOpenChatbot,
  onUploadDocs,
}: {
  open: boolean;
  onClose: () => void;
  onOpenChatbot: () => void;
  onUploadDocs: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">⚠️ ICE activity reported near you</h2>
        <p className="text-sm text-muted-foreground">
          Need help knowing what to do?
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onUploadDocs}>
            Upload Docs
          </Button>
          <Button onClick={onOpenChatbot}>Open Chatbot</Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
