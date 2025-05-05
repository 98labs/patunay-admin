import { useSession } from "../context/SessionContext";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const { session } = useSession();
  return (
    <main>
      <section className="main-container">
        <h1 className="header-text">404 Page Not Found</h1>
        <Link to={!session ? "/login" : "/dashboard"}>Go back to Home</Link>
      </section>
    </main>
  );
};

export default NotFoundPage;
