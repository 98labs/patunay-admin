import { Button, FormField } from "@components";
import { InputType } from "@typings";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="m-auto flex flex-col items-center gap-2">
        <div className="flex flex-col gap-2 items-center ">
          <img src="assets/logo/patunay-logo.png" alt="" />
          <h2 className="m-auto text-[32px] leading-10 font-medium">
            Welcome to Patunay
          </h2>
        </div>
        <div className="flex flex-col flex-top gap-2">
          <FormField inputType={InputType.Email} hint="Email" />
          <FormField inputType={InputType.Password} hint="Password" />
          <Button buttonLabel="Log in" onClick={handleLogin} />
        </div>
      </div>
    </div>
  );
};

export default Login;
