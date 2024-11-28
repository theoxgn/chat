import { create } from "zustand";

const toast = create((set) => ({
  // toast left
  showToast: false,
  setShowToast: (value) => set({ showToast: value }),
  dataToast: { type: "", message: "" },
  setDataToast: (value) => set({ dataToast: value }),
  // bottomsheet responsive
  showBottomsheet: false,
  setShowBottomsheet: () =>
    set((state) => ({ showBottomsheet: !state.showBottomsheet })),
  dataBottomsheet: "",
  setDataBottomsheet: (state) => set({ dataBottomsheet: state }),
  titleBottomsheet: "",
  setTitleBottomsheet: (state) => set({ titleBottomsheet: state }),
  // sidebar show hide
  showSidebar: true,
  setShowSidebar: (showState) => set({ showSidebar: showState }),
  // navigation menu mobile show hide
  showNavMenu: true,
  setShowNavMenu: (showState) => set({ showNavMenu: showState }),
}));

export default toast;
