// src/components/OpenUploadModalButton.tsx — tidak berubah.

import { type UploadModalVariant, useUIStore } from "@/lib/store/useUIStore";

export default function OpenUploadModalButton({
  variant,
  label,
  className,
}: {
  variant: UploadModalVariant;
  label: React.ReactNode;
  className: string;
}) {
  const openUploadModal = useUIStore((s) => s.openUploadModal);
  return (
    <button type="button" onClick={() => openUploadModal(variant)} className={className}>
      {label}
    </button>
  );
}
