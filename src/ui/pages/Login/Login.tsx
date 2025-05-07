import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { FormField, NotificationMessage } from "@components";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";
import { InputType } from "@typings";
import { setUser } from "./slice";
import { showNotification } from "../../components/NotificationMessage/slice";

import logo from "@/assets/logo/patunay-logo.png";

const Login = () => {
  const dispatch = useDispatch();
  // ==============================
  // If user is already logged in, redirect to home
  // This logic is being repeated in SignIn and SignUp..
  const { session } = useSession();

  if (session) return <Navigate to="/dashboard" />;

  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });
    if (data) {
      const msg = {
        message: "Successfully Login",
        status: "success",
      };
      dispatch(showNotification(msg));
      dispatch(setUser(data.user));
    }

    if (error) {
      const msg = {
        message: error.message,
        status: "error",
      };
      dispatch(showNotification(msg));
    }
    setStatus("");
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <NotificationMessage />
      <div className="m-auto flex flex-col items-center gap-2">
        <div className="flex flex-col gap-2 items-center ">
          <img src={logo} />
          <h2 className="m-auto text-[32px] leading-10 font-medium">
            Welcome to Patunay
          </h2>
          <div className="text-sm">
            Version: {__APP_VERSION__}
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="main-container" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm/6 font-medium">
                Email address
              </label>
              <div className="mt-2">
                <FormField
                  name="email"
                  inputType={InputType.Email}
                  hint="Email"
                  onInputChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm/6 font-medium">
                  Password
                </label>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <FormField
                  name="password"
                  inputType={InputType.Password}
                  hint="Password"
                  onInputChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-2">
              <button type="submit" className="btn btn-primary btn-block">
                {status ? status : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
