import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice(
    {
        name:'cart',
        initialState: {
            items:[]
        },
        reducers: {
            addItem: (state,action) => {
                // Check if item already exists
                const existing = state.items.find(item => item.card.info.id === action.payload.card.info.id);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    state.items.push({...action.payload, quantity: 1});
                }
            },
            removeItem: (state,action) => {
                // Remove one quantity or remove item if quantity is 1
                const idx = state.items.findIndex(item => item.card.info.id === action.payload.card.info.id);
                if (idx > -1) {
                    if (state.items[idx].quantity > 1) {
                        state.items[idx].quantity -= 1;
                    } else {
                        state.items.splice(idx, 1);
                    }
                }
            },
            incrementQuantity: (state,action) => {
                const existing = state.items.find(item => item.card.info.id === action.payload.card.info.id);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                }
            },
            decrementQuantity: (state,action) => {
                const idx = state.items.findIndex(item => item.card.info.id === action.payload.card.info.id);
                if (idx > -1) {
                    if (state.items[idx].quantity > 1) {
                        state.items[idx].quantity -= 1;
                    } else {
                        state.items.splice(idx, 1);
                    }
                }
            },
            clearCart: (state) => {
                //RTK - either Mutate the existing state or return a new state
                // state.items.length = 0; //originalState = []

                return {items:[]}; //this new object will be replaced inside originalState = []
            }
        }
    }
)
export const {addItem, removeItem, clearCart, incrementQuantity, decrementQuantity} = cartSlice.actions;
export default cartSlice.reducer; 