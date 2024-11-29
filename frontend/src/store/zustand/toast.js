import { create } from "zustand";

const toast = create((set) => ({
  showToast: false,
  setShowToast: (value) => set({ showToast: value }),
  dataToast: { type: "", message: "" },
  setDataToast: (value) => set({ dataToast: value }),
}));

export default toast;
