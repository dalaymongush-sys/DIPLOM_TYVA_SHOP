import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  };

  const getCartCount = () => {
    const user = getCurrentUser();
    const key = user ? `cart_${user.id}` : "cart_guest";
    try {
      const cart = JSON.parse(localStorage.getItem(key) || "[]");
      return cart.reduce((s, i) => s + i.quantity, 0);
    } catch {
      return 0;
    }
  };

  const [cartCount, setCartCount] = useState(getCartCount);

  const refreshCart = () => setCartCount(getCartCount());

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
