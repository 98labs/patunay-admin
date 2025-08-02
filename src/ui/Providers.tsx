import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { NfcStatusProvider } from "./context/NfcStatusContext";

const Providers = () => {
  console.log('Providers: Rendering');
  return (
    <SessionProvider>
      <NfcStatusProvider>
        <Outlet />
      </NfcStatusProvider>
    </SessionProvider>
  );
};

export default Providers;