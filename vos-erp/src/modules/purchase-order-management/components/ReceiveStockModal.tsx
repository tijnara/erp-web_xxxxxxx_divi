import React from "react";

export function ReceiveStockModal({ open, onClose, ...props }: { open: boolean; onClose: () => void; [key: string]: any }) {
  // ...modal content from PurchaseOrderView, refactored for reusability...
  return (
    <div style={{ display: open ? "flex" : "none" }} className="modal-backdrop">
      <div className="modal bg-white w-11/12 md:max-w-lg mx-auto rounded-lg shadow-xl p-6">
        {/* Modal content here, use props for data and handlers */}
        <button type="button" className="modal-close-btn text-gray-500 hover:text-gray-800 text-3xl" onClick={onClose}>&times;</button>
        {/* ...rest of modal... */}
      </div>
    </div>
  );
}
