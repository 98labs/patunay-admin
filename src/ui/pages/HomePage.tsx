import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

import { Cards } from "../components";
import { Session } from "@supabase/supabase-js";

const msg = (session: Session | null) => (
  <>
    {session ? (
      <Link to="/dashboard">Dashboard</Link>
    ) : (
      <Link to="/login">Sign In</Link>
    )}
  </>
)

const HomePage = () => {
  const { session } = useSession();
 
  return (
    <div className="flex items-center justify-center h-screen">
      <main className="flex-1 p-6 bg-base-100">
        <section className="flex items-center justify-center h-96">
          <Cards title="WELCOME TO PATUNAY" message={msg(session)} />
        </section>
      </main>
  </div>
  );
};

export default HomePage;