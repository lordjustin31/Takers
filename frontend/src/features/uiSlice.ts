import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type ThemeMode = "dark" | "light"

interface UiState {
  theme: ThemeMode
  isSellModalOpen: boolean
}

const initialState: UiState = {
  theme: "dark",
  isSellModalOpen: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark"
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload
    },
    openSellModal(state) {
      state.isSellModalOpen = true
    },
    closeSellModal(state) {
      state.isSellModalOpen = false
    },
  },
})

export const { toggleTheme, setTheme, openSellModal, closeSellModal } =
  uiSlice.actions

export default uiSlice.reducer
