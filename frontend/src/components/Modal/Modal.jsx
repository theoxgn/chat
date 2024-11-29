// components/Modal/Modal.jsx
import {useEffect} from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => closeOnBackdrop && onClose()}
        />

        {/* Modal */}
        <div
          className={`relative ${width} w-full bg-white rounded-lg shadow-xl`}
        >
          {/* Header */}
          <div className="relative">
            {/* Background Image */}
            <div
              className="h-16 bg-[#176cf7] relative overflow-hidden rounded-t-md"
              style={{
                backgroundImage: "url('/img/headermodal386.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
            </div>

            {/* Title and Close Button Container */}
            <div className="absolute -right-1 top-2 flex items-center justify-between px-4">
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 bg-white rounded-full transition-colors"
                >
                  <X size={13} className="text-[#176cf7]" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="py-9 px-6">
            {title && (
              <span className="font-bold text-[#1b1b1b] text-sm capitalize flex justify-center mb-6">
                {title}
              </span>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
