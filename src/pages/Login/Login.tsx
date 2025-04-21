import { useState } from "react";
import {  Navigate } from "react-router-dom";

import {  FormField } from "@components";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";
import { InputType } from "@typings";
import { KEY_SESSION } from "../../content";


const Login = () => {
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

    const { error } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });

    if (error) {
      alert(error.message);
    }
    setStatus("");
  };

  return (

    <div className="flex min-h-full flex-col justify-center px-6 py-24 lg:px-12">
      <div className="p-12 mx-auto rounded-2xl w-100 ">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 text-white">Sign in to your account</h2>
        </div>
      
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="main-container" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm/6 font-medium text-gray-900 text-white">Email address</label>
              <div className="mt-2">
              <FormField name="email" inputType={InputType.Email} hint="Email" onInputChange={handleInputChange}/>
              </div>
            </div>
      
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm/6 font-medium text-gray-900 text-white">Password</label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                </div>
              </div>
              <div className="mt-2">
              <FormField name="password" inputType={InputType.Password} hint="Password" onInputChange={handleInputChange}/>
              </div>
            </div>
      
            <div className="mt-2">
              <button type="submit" className="btn btn-primary btn-block">{status ? status : 'Sign in'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
