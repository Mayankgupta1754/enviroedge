import { redirect } from "next/navigation";

const Homepage = () => {
  redirect("/admin");
};

export default Homepage;