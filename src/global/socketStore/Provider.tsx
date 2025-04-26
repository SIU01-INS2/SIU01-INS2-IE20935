"use client";

import { Provider } from "react-redux";
import store from ".";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default SocketProvider;
