import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { NfcStatusProvider } from "./context/NfcStatusContext";

const Providers = () => {
  return (
    <SessionProvider>
      <NfcStatusProvider>
        <Outlet />
      </NfcStatusProvider>
    </SessionProvider>
  );
};

export default Providers;